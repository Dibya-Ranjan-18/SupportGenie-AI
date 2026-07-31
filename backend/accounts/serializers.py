"""
Accounts serializers — Register, Login, Profile, Password management.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'role': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'validators': []},     # custom validation below for clean error messages
            'username': {'validators': []},  # custom validation below
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        # Prevent self-assigning admin role via registration
        if attrs.get('role') == 'admin':
            attrs['role'] = 'customer'

        # Clean email
        email = attrs.get('email', '').strip().lower()
        attrs['email'] = email

        # Check email uniqueness case-insensitively
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({'email': 'An account with this email address already exists.'})

        # Handle username fallback
        username = attrs.get('username', '').strip()
        if not username:
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while CustomUser.objects.filter(username__iexact=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
        else:
            if CustomUser.objects.filter(username__iexact=username).exists():
                raise serializers.ValidationError({'username': 'This username is already taken.'})

        attrs['username'] = username
        return attrs

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Validates admin-editable user fields with proper type enforcement."""
    class Meta:
        model = CustomUser
        fields = ['is_blocked', 'is_active', 'role']

    def validate_role(self, value):
        valid_roles = {r[0] for r in CustomUser.ROLE_CHOICES}
        if value not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of: {', '.join(valid_roles)}.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is inactive.')
        if user.is_blocked:
            raise serializers.ValidationError('Your account has been blocked. Please contact support.')
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'role', 'bio', 'phone', 'avatar', 'avatar_url',
            'is_active', 'is_blocked', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_blocked', 'created_at', 'updated_at', 'last_login']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        url = obj.avatar.url
        return url if url.startswith('http') else f"http://localhost:8000{url}"


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'first_name', 'last_name', 'bio', 'phone', 'avatar']

    def validate_username(self, value):
        user = self.context['request'].user
        if CustomUser.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management views."""
    full_name = serializers.ReadOnlyField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_blocked', 'avatar_url', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'last_login']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None
