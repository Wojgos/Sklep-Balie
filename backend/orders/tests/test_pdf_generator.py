"""
Tests for PDF generator functions.
"""
import pytest
from unittest.mock import patch, MagicMock
from orders.pdf_generator import generate_invoice_pdf, generate_statistics_pdf
from orders.models import Order
from decimal import Decimal


@pytest.mark.django_db
class TestGenerateInvoicePDF:
    """Tests for generate_invoice_pdf function."""
    
    def test_generate_invoice_pdf_with_weasyprint(self, order):
        """Test PDF generation when WeasyPrint is available."""
        with patch('orders.pdf_generator.HTML') as mock_html_class:
            mock_html_instance = MagicMock()
            mock_html_instance.write_pdf.return_value = b"fake_pdf_content"
            mock_html_class.return_value = mock_html_instance
            
            result = generate_invoice_pdf(order)
            
            assert result == b"fake_pdf_content"
            mock_html_class.assert_called_once()
            mock_html_instance.write_pdf.assert_called_once()
    
    def test_generate_invoice_pdf_without_weasyprint(self, order):
        """Test PDF generation raises error when WeasyPrint is not available."""
        with patch('orders.pdf_generator.HTML', None):
            # Set WEASYPRINT_IMPORT_ERROR if it doesn't exist
            import orders.pdf_generator as pdf_module
            if not hasattr(pdf_module, 'WEASYPRINT_IMPORT_ERROR'):
                pdf_module.WEASYPRINT_IMPORT_ERROR = Exception("Import error")
            
            with pytest.raises(RuntimeError) as exc_info:
                generate_invoice_pdf(order)
            
            assert "Generowanie PDF jest niedostępne" in str(exc_info.value)
            assert "WeasyPrint" in str(exc_info.value)


@pytest.mark.django_db
class TestGenerateStatisticsPDF:
    """Tests for generate_statistics_pdf function."""
    
    def test_generate_statistics_pdf_with_weasyprint(self):
        """Test statistics PDF generation when WeasyPrint is available."""
        statistics_data = {
            'period': {
                'start_date': '2024-01-01',
                'end_date': '2024-01-31'
            },
            'summary': {
                'total_revenue': 1000.00,
                'total_orders': 10,
                'average_order_value': 100.00
            },
            'top_products': [],
            'revenue_by_category': [],
            'orders_by_status': []
        }
        
        with patch('orders.pdf_generator.HTML') as mock_html_class:
            mock_html_instance = MagicMock()
            mock_html_instance.write_pdf.return_value = b"fake_pdf_content"
            mock_html_class.return_value = mock_html_instance
            
            result = generate_statistics_pdf(statistics_data)
            
            assert result == b"fake_pdf_content"
            mock_html_class.assert_called_once()
            mock_html_instance.write_pdf.assert_called_once()
    
    def test_generate_statistics_pdf_without_weasyprint(self):
        """Test statistics PDF generation raises error when WeasyPrint is not available."""
        statistics_data = {
            'period': {'start_date': '2024-01-01', 'end_date': '2024-01-31'},
            'summary': {'total_revenue': 1000.00, 'total_orders': 10}
        }
        
        with patch('orders.pdf_generator.HTML', None):
            # Set WEASYPRINT_IMPORT_ERROR if it doesn't exist
            import orders.pdf_generator as pdf_module
            if not hasattr(pdf_module, 'WEASYPRINT_IMPORT_ERROR'):
                pdf_module.WEASYPRINT_IMPORT_ERROR = Exception("Import error")
            
            with pytest.raises(RuntimeError) as exc_info:
                generate_statistics_pdf(statistics_data)
            
            assert "Generowanie PDF jest niedostępne" in str(exc_info.value)
            assert "WeasyPrint" in str(exc_info.value)

