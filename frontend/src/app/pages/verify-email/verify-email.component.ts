import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationType } from '../../models';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Krok 3: Angular pobiera klucz z adresu URL
    const key = this.route.snapshot.paramMap.get('key');

    if (key) {
      this.verifyEmail(key);
    } else {
      this.isLoading = false;
      this.errorMessage = 'Nieprawidłowy link weryfikacyjny (brak klucza).';
    }
  }

  verifyEmail(key: string): void {
    // Krok 4: Angular wysyła klucz do backendu
    this.authService.verifyEmail(key).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
        this.notificationService.show(
          'E-mail potwierdzony pomyślnie! Możesz się zalogować.',
          NotificationType.SUCCESS
        );
        
        // Opcjonalne automatyczne przekierowanie po chwili
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.errorMessage = 'Wystąpił błąd podczas weryfikacji. Link może być nieprawidłowy lub wygasł.';
        console.error('Verification error:', error);
      }
    });
  }
}

