"""
Accounts views — Register, Login, Logout, Profile, Password management, Admin user management.
"""
import secrets
import random
import string
from datetime import timedelta

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import CustomUser, PasswordResetToken
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    AdminUserSerializer, AdminUpdateUserSerializer
)
from .permissions import IsAdmin


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def set_refresh_cookie(response, refresh_token):
    """Set HttpOnly, Secure cookie for refresh token."""
    cookie_max_age = getattr(settings, 'SIMPLE_JWT', {}).get('REFRESH_TOKEN_LIFETIME', timedelta(days=7)).total_seconds()
    # Cross-site cookies between Vercel & Render require SameSite='None' and Secure=True in production
    samesite = 'None' if not settings.DEBUG else 'Lax'
    secure = True if not settings.DEBUG else False
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        max_age=int(cookie_max_age),
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/api/v1/auth/',
    )
    return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            res = Response({
                'message': 'Account created successfully.',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
            return set_refresh_cookie(res, tokens['refresh'])
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            res = Response({
                'message': 'Login successful.',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': tokens,
            })
            return set_refresh_cookie(res, tokens['refresh'])
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)

        res = Response(serializer.validated_data, status=status.HTTP_200_OK)
        new_refresh = serializer.validated_data.get('refresh')
        if new_refresh:
            set_refresh_cookie(res, new_refresh)
        return res


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        res = Response({'message': 'Logged out successfully.'})
        res.delete_cookie('refresh_token', path='/api/v1/auth/')
        return res


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully.',
                'user': UserProfileSerializer(request.user, context={'request': request}).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            # Blacklist current refresh token so old sessions are invalidated
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                try:
                    RefreshToken(refresh_token).blacklist()
                except Exception:
                    pass
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """Step 1: User enters email → sends 6-digit OTP to their inbox."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].strip().lower()
            PasswordResetToken.cleanup_expired()
            user = CustomUser.objects.filter(email__iexact=email).first()
            if user:
                # Invalidate previous tokens
                PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
                # Generate 6-digit OTP
                otp = ''.join(random.choices(string.digits, k=6))
                token = secrets.token_urlsafe(32)  # unique DB key
                PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    otp=otp,
                    expires_at=timezone.now() + timedelta(minutes=10)
                )
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                  <div style="text-align: center; margin-bottom: 28px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 12px; padding: 14px 18px;">
                      <span style="color: white; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">SupportGenie AI</span>
                    </div>
                  </div>
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 8px; text-align: center;">Password Reset OTP</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7; text-align: center; margin-bottom: 28px;">Hi <strong>{user.username}</strong>, use the OTP below to reset your SupportGenie AI password.</p>
                  <div style="background: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <p style="color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Your One-Time Password</p>
                    <span style="font-size: 42px; font-weight: 900; color: #4f46e5; letter-spacing: 12px; font-family: monospace;">{otp}</span>
                  </div>
                  <p style="color: #ef4444; font-size: 13px; text-align: center; margin-bottom: 20px;">⏱️ This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="color: #94a3b8; font-size: 11px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
                  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 4px;">SupportGenie AI · Enterprise Platform</p>
                </div>
                """
                try:
                    send_mail(
                        subject=f'{otp} — SupportGenie AI Password Reset OTP',
                        message=f'Your OTP is: {otp}\n\nThis expires in 10 minutes. Do not share it with anyone.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        html_message=html_body,
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"[Email Error] OTP mail failed for {user.email}: {e}")
            return Response({'message': 'If this email is registered, you will receive an OTP shortly.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """Step 2: User submits email + OTP → returns a short-lived reset session token."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = CustomUser.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Invalid OTP or email.'}, status=status.HTTP_400_BAD_REQUEST)
        reset_token = PasswordResetToken.objects.filter(
            user=user, otp=otp, is_used=False,
            expires_at__gt=timezone.now()
        ).first()
        if not reset_token:
            return Response({'error': 'Invalid or expired OTP. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        # Clear OTP so it cannot be reused, but keep token active for step 3
        reset_token.otp = ''
        reset_token.save(update_fields=['otp'])
        return Response({'token': reset_token.token, 'message': 'OTP verified. You may now reset your password.'})


class ResetPasswordView(APIView):
    """Step 3: User submits token + new password → resets account password."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token_str = serializer.validated_data['token']
            try:
                token = PasswordResetToken.objects.get(
                    token=token_str, is_used=False,
                    expires_at__gt=timezone.now()
                )
                token.user.set_password(serializer.validated_data['new_password'])
                token.user.save()
                token.is_used = True
                token.save()
                return Response({'message': 'Password reset successfully.'})
            except PasswordResetToken.DoesNotExist:
                return Response(
                    {'error': 'Invalid or expired session. Please start over.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── ADMIN: USER MANAGEMENT ──────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '')
        role = self.request.query_params.get('role', '')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserSerializer(user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Prevent admin from demoting their own role (self-lockout guard)
        if user == request.user and 'role' in request.data and request.data['role'] != 'admin':
            return Response(
                {'error': 'You cannot demote your own admin role.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = AdminUpdateUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User updated.', 'user': AdminUserSerializer(user, context={'request': request}).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response({'error': 'Cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'User deleted.'}, status=status.HTTP_204_NO_CONTENT)
