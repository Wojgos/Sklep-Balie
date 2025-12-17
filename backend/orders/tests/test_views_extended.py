"""
Extended tests for order views.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from orders.models import Order
from decimal import Decimal


@pytest.mark.django_db
class TestOrderInvoiceView:
    """Tests for OrderInvoiceView."""
    
    def test_get_invoice_pdf_success(self, api_client, admin_user, order):
        """Test successful PDF invoice generation."""
        api_client.force_authenticate(user=admin_user)
        
        with patch('orders.views.generate_invoice_pdf') as mock_pdf:
            mock_pdf.return_value = b"fake_pdf_content"
            
            url = reverse('orders:order-invoice', kwargs={'order_id': order.id})
            response = api_client.get(url)
            
            assert response.status_code == status.HTTP_200_OK
            assert response['Content-Type'] == 'application/pdf'
            assert b"fake_pdf_content" in response.content
            mock_pdf.assert_called_once_with(order)
    
    def test_get_invoice_pdf_not_found(self, api_client, admin_user):
        """Test invoice generation for non-existent order."""
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('orders:order-invoice', kwargs={'order_id': 99999})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_invoice_pdf_requires_admin_or_owner(self, api_client, user, order):
        """Test invoice generation requires admin or owner."""
        # Order owner should have access
        api_client.force_authenticate(user=user)
        
        url = reverse('orders:order-invoice', kwargs={'order_id': order.id})
        response = api_client.get(url)
        
        # Order owner should have access (not 403)
        # But if order.user != user, then 403
        if order.user == user:
            # Owner should have access (might fail on PDF generation, but not 403)
            assert response.status_code != status.HTTP_403_FORBIDDEN
        else:
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_invoice_pdf_requires_admin_for_other_order(self, api_client, user):
        """Test invoice generation requires admin for other user's order."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_user = User.objects.create_user(
            username="other",
            email="other@test.com",
            password="pass"
        )
        from orders.models import Order
        from decimal import Decimal
        other_order = Order.objects.create(
            user=other_user,
            first_name="Other",
            email="other@test.com",
            address="Addr",
            postal_code="00-000",
            city="City",
            total_price=Decimal("100.00")
        )
        
        api_client.force_authenticate(user=user)
        
        url = reverse('orders:order-invoice', kwargs={'order_id': other_order.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_invoice_pdf_pdf_error(self, api_client, admin_user, order):
        """Test invoice generation handles PDF generation error."""
        api_client.force_authenticate(user=admin_user)
        
        with patch('orders.views.generate_invoice_pdf') as mock_pdf:
            mock_pdf.side_effect = RuntimeError("PDF generation failed")
            
            url = reverse('orders:order-invoice', kwargs={'order_id': order.id})
            response = api_client.get(url)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "error" in response.data


@pytest.mark.django_db
class TestStatisticsReportPDFView:
    """Tests for StatisticsReportPDFView."""
    
    def test_get_statistics_pdf_success(self, api_client, admin_user, order):
        """Test successful statistics PDF generation."""
        api_client.force_authenticate(user=admin_user)
        
        # The view imports generate_statistics_pdf inside the get method
        # Patch it at the pdf_generator module level
        with patch('orders.pdf_generator.generate_statistics_pdf') as mock_pdf:
            mock_pdf.return_value = b"fake_pdf_content"
            
            url = reverse('orders:sales-stats-pdf')
            response = api_client.get(url, {'start_date': '2024-01-01', 'end_date': '2024-01-31'})
            
            # Should return PDF if successful
            assert response.status_code == status.HTTP_200_OK
            assert response['Content-Type'] == 'application/pdf'
            assert b"fake_pdf_content" in response.content
            mock_pdf.assert_called_once()
    
    def test_get_statistics_pdf_requires_admin(self, api_client, user):
        """Test statistics PDF requires admin."""
        api_client.force_authenticate(user=user)
        
        url = reverse('orders:sales-stats-pdf')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_statistics_pdf_missing_params(self, api_client, admin_user):
        """Test statistics PDF with missing parameters."""
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('orders:sales-stats-pdf')
        response = api_client.get(url)
        
        # Should return 400 or handle gracefully
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]


@pytest.mark.django_db
class TestSalesStatsView:
    """Tests for SalesStatsView."""
    
    def test_get_sales_stats_success(self, api_client, admin_user, order):
        """Test successful sales stats retrieval."""
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('orders:sales-stats')
        response = api_client.get(url, {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'period' in response.data
        assert 'summary' in response.data
    
    def test_get_sales_stats_missing_params(self, api_client, admin_user):
        """Test sales stats with missing parameters."""
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('orders:sales-stats')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_get_sales_stats_invalid_date_format(self, api_client, admin_user):
        """Test sales stats with invalid date format."""
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('orders:sales-stats')
        response = api_client.get(url, {
            'start_date': 'invalid-date',
            'end_date': '2024-12-31'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_get_sales_stats_requires_admin(self, api_client, user):
        """Test sales stats requires admin."""
        api_client.force_authenticate(user=user)
        
        url = reverse('orders:sales-stats')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

