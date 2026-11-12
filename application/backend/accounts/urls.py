from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    UserProfileView, 
    ChangePasswordView, 
    CustomTokenObtainPairView,
    ActivateAccountView,
    VerifyOTPView

)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # 👈 Utilise la vue personnalisée ici
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('activate/<int:user_id>/', ActivateAccountView.as_view(), name='activate_account'), # 👈 Lien d'activation pour le Super-Admin
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),

    path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]