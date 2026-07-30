"""
Accounts app models — CustomUser with role-based authentication.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True, default='')
    is_blocked = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_customer(self):
        return self.role == 'customer'

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class PasswordResetToken(models.Model):
    """Tracks password reset OTPs with expiry."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)   # secure random token for URL fallback
    otp = models.CharField(max_length=6, blank=True, default='')  # 6-digit OTP
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'password_reset_tokens'

    def __str__(self):
        return f"Reset token for {self.user.email}"

    @classmethod
    def cleanup_expired(cls):
        """Delete tokens older than 1 hour to keep table tidy (OTPs expire in 10 min)."""
        cutoff = timezone.now() - timedelta(hours=1)
        cls.objects.filter(created_at__lt=cutoff).delete()
