import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { LoyaltyProgram, LoyaltyReward, UserLoyaltyPoints, RedeemedReward } from '../../models';

type ModalType = 'confirm' | 'success' | 'code' | 'error';

interface ModalState {
  open: boolean;
  type?: ModalType;
  title?: string;
  message?: string;
  couponCode?: string;
  expiryText?: string | null;
}

@Component({
  selector: 'bg-loyalty',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="flex-1 bg-background py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-2">
            {{ 'LOYALTY.TITLE' | translate }}
          </h1>
          <p class="text-muted-foreground">{{ 'LOYALTY.SUBTITLE' | translate }}</p>
        </div>

        <!-- User Points Summary -->
        <div *ngIf="userPoints" class="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <div class="text-5xl font-bold text-primary mb-2">{{ userPoints.availablePoints }}</div>
              <div class="text-sm text-muted-foreground mb-1">{{ 'LOYALTY.AVAILABLE_POINTS' | translate }}</div>
              <div class="text-xs text-muted-foreground">{{ 'LOYALTY.TOTAL_POINTS' | translate }}: {{ userPoints.totalPoints }}</div>
            </div>
            <div>
              <div class="text-4xl font-semibold text-muted-foreground mb-2">{{ userPoints.usedPoints }}</div>
              <div class="text-sm text-muted-foreground">{{ 'LOYALTY.USED_POINTS' | translate }}</div>
            </div>
          </div>
        </div>

        <!-- Program Info -->
        <div *ngIf="loyaltyProgram" class="bg-card border border-card-border rounded-lg p-6 mb-8">
          <h2 class="text-2xl font-semibold mb-3">{{ loyaltyProgram.name }}</h2>
          <p class="text-muted-foreground mb-4">{{ loyaltyProgram.description }}</p>
          <div class="inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span class="font-medium">{{ getPointsPerZlotyMessage() }}</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-border mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              (click)="activeTab = 'rewards'"
              [class]="activeTab === 'rewards'
                ? 'border-primary text-primary border-b-2 py-4 px-1 text-sm font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-4 px-1 text-sm font-medium'"
            >
              {{ 'LOYALTY.TAB_REWARDS' | translate }}
            </button>
            <button
              (click)="activeTab = 'myRewards'"
              [class]="activeTab === 'myRewards'
                ? 'border-primary text-primary border-b-2 py-4 px-1 text-sm font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-4 px-1 text-sm font-medium'"
            >
              {{ 'LOYALTY.TAB_MY_REWARDS' | translate }}
            </button>
          </nav>
        </div>

        <!-- Available Rewards Tab -->
        <div *ngIf="activeTab === 'rewards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let reward of availableRewards$ | async"
               class="bg-card border-2 rounded-lg overflow-hidden hover:border-primary transition-all duration-200 flex flex-col h-full"
               [class.border-card-border]="!canAffordReward(reward)"
               [class.border-primary]="canAffordReward(reward)">
            <!-- Reward Image -->
            <div class="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <svg class="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
            </div>

            <div class="p-4 flex flex-col flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-lg">{{ reward.name }}</h3>
                <span *ngIf="reward.isActive" class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  {{ 'LOYALTY.ACTIVE_STATUS' | translate }}
                </span>
              </div>

              <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ reward.description }}</p>

              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">{{ 'LOYALTY.REWARD_COST' | translate }}</span>
                  <span class="font-bold text-primary">{{ reward.pointsCost }} {{ 'LOYALTY.POINTS' | translate }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">{{ 'LOYALTY.REWARD_VALUE' | translate }}</span>
                  <span class="font-semibold">{{ formatRewardValue(reward) }}</span>
                </div>
                <div *ngIf="reward.validUntil" class="flex justify-between text-sm">
                  <span class="text-muted-foreground">{{ 'LOYALTY.VALID_UNTIL' | translate }}</span>
                  <span class="text-xs">{{ reward.validUntil | date:'dd.MM.yyyy' }}</span>
                </div>
              </div>

              <button
                (click)="redeemReward(reward)"
                [disabled]="!canAffordReward(reward) || !reward.isActive"
                class="w-full py-2 rounded-lg font-semibold transition-all duration-200 mt-auto"
                [ngClass]="{
                  'bg-primary text-primary-foreground hover:bg-primary/90': canAffordReward(reward) && reward.isActive,
                  'bg-muted text-muted-foreground cursor-not-allowed': !canAffordReward(reward) || !reward.isActive
                }"
              >
                {{ !canAffordReward(reward) ? ('LOYALTY.NOT_ENOUGH_POINTS' | translate) : ('LOYALTY.REDEEM_POINTS' | translate) }}
              </button>
            </div>
          </div>
        </div>

        <!-- My Rewards Tab -->
        <div *ngIf="activeTab === 'myRewards'">
          <div *ngIf="(redeemedRewards$ | async)?.length === 0" class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p class="text-muted-foreground mb-2">{{ 'LOYALTY.NO_REDEEMED_REWARDS' | translate }}</p>
            <button
              (click)="activeTab = 'rewards'"
              class="text-primary hover:underline font-medium"
            >
              {{ 'LOYALTY.BROWSE_REWARDS' | translate }}
            </button>
          </div>

          <div *ngIf="(redeemedRewards$ | async)?.length! > 0" class="space-y-4">
            <div *ngFor="let redemption of redeemedRewards$ | async"
                 class="bg-card border border-card-border rounded-lg p-6">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold">{{ redemption.rewardName || redemption.reward?.name || 'Nagroda' }}</h3>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      [ngClass]="redemption.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'"
                    >
                      {{ redemption.isUsed ? ('LOYALTY.USED_STATUS' | translate) : ('LOYALTY.AVAILABLE_STATUS' | translate) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground mb-3" *ngIf="redemption.reward?.description">
                    {{ redemption.reward?.description }}
                  </p>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-muted-foreground">{{ 'LOYALTY.COUPON_CODE' | translate }}</span>
                      <div class="font-mono font-bold text-primary mt-1">{{ redemption.code }}</div>
                    </div>
                    <div>
                      <span class="text-muted-foreground">{{ 'LOYALTY.POINTS' | translate }}:</span>
                      <div class="font-semibold mt-1">{{ redemption.pointsSpent }}</div>
                    </div>
                    <div>
                      <span class="text-muted-foreground">{{ 'LOYALTY.REDEEM_DATE' | translate }}</span>
                      <div class="mt-1">{{ redemption.createdAt | date:'dd.MM.yyyy' }}</div>
                    </div>
                    <div *ngIf="redemption.expiresAt">
                      <span class="text-muted-foreground">{{ 'LOYALTY.EXPIRES_AT' | translate }}</span>
                      <div class="mt-1">{{ redemption.expiresAt | date:'dd.MM.yyyy' }}</div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!redemption.isUsed" class="text-right">
                  <button
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    (click)="showCouponCodeModal(redemption.couponCode || redemption.code, redemption.rewardName || redemption.reward?.name)"
                  >
                    {{ 'LOYALTY.SHOW_CODE' | translate }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Custom Modal -->
    <div *ngIf="modalState.open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/50" (click)="closeModal()"></div>
  <div class="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <button
          class="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          (click)="closeModal()"
          [attr.aria-label]="'COMMON.CLOSE' | translate"
        >
          ✕
        </button>
        <h3 class="text-xl font-semibold mb-2">{{ modalState.title }}</h3>
        <p class="text-sm text-muted-foreground mb-4" *ngIf="modalState.message">{{ modalState.message }}</p>

        <div *ngIf="modalState.couponCode" class="mb-4">
          <div class="font-mono text-lg tracking-wide bg-muted rounded-lg px-4 py-3 text-center border border-border">
            {{ modalState.couponCode }}
          </div>
          <p *ngIf="modalState.expiryText" class="text-xs text-muted-foreground mt-2">
            {{ 'LOYALTY.COUPON_VALID_UNTIL' | translate:{date: modalState.expiryText} }}
          </p>
          <p *ngIf="copyFeedback" class="text-xs mt-2" [ngClass]="{'text-green-600': copyFeedbackSuccess, 'text-red-500': !copyFeedbackSuccess}">
            {{ copyFeedback }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6" [ngSwitch]="modalState.type">
          <ng-container *ngSwitchCase="'confirm'">
            <button
              class="px-4 py-2 rounded-lg border border-border text-sm"
              (click)="closeModal()"
              [disabled]="modalLoading"
            >
              {{ 'COMMON.CANCEL' | translate }}
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              (click)="confirmRedeemReward()"
              [disabled]="modalLoading"
            >
              {{ modalLoading ? ('LOYALTY.PROCESSING' | translate) : ('COMMON.CONFIRM' | translate) }}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'success'">
            <button
              class="px-4 py-2 rounded-lg border border-border text-sm"
              *ngIf="modalState.couponCode"
              (click)="copyCouponToClipboard(modalState.couponCode)"
            >
              {{ 'LOYALTY.COPY_CODE' | translate }}
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              (click)="closeModal()"
            >
              {{ 'COMMON.CLOSE' | translate }}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'code'">
            <button
              class="px-4 py-2 rounded-lg border border-border text-sm"
              *ngIf="modalState.couponCode"
              (click)="copyCouponToClipboard(modalState.couponCode)"
            >
              {{ 'LOYALTY.COPY_CODE' | translate }}
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              (click)="closeModal()"
            >
              {{ 'COMMON.CLOSE' | translate }}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'error'">
            <button
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold w-full"
              (click)="closeModal()"
            >
              {{ 'COMMON.CLOSE' | translate }}
            </button>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loyalty.component.scss']
})
export class LoyaltyComponent implements OnInit {
  activeTab: 'rewards' | 'myRewards' = 'rewards';
  
  loyaltyProgram: LoyaltyProgram | null = null;
  userPoints: UserLoyaltyPoints | null = null;
  availableRewards$: Observable<LoyaltyReward[]>;
  redeemedRewards$: Observable<RedeemedReward[]>;
  modalState: ModalState = { open: false };
  pendingReward: LoyaltyReward | null = null;
  modalLoading = false;
  copyFeedback = '';
  copyFeedbackSuccess = true;

  constructor(
    private apiService: ApiService,
    private translate: TranslateService
  ) {
    this.availableRewards$ = this.apiService.getLoyaltyOffers();
    this.redeemedRewards$ = this.apiService.getMyRedeemedRewards();
  }

  ngOnInit(): void {
    this.loadData();
    
    this.translate.onLangChange.subscribe(() => {
      this.updateLoyaltyProgramTranslations();
    });
  }

  loadData(): void {
    this.loyaltyProgram = {
      id: '1',
      name: this.translate.instant('LOYALTY.PROGRAM_NAME'),
      description: this.translate.instant('LOYALTY.PROGRAM_DESCRIPTION'),
      pointsPerZloty: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.apiService.getUserLoyaltyPoints().subscribe({
      next: (points) => {
        this.userPoints = points;
      },
      error: (err) => {
        console.error('Error loading user points:', err);
      }
    });
  }

  updateLoyaltyProgramTranslations(): void {
    if (this.loyaltyProgram) {
      this.loyaltyProgram.name = this.translate.instant('LOYALTY.PROGRAM_NAME');
      this.loyaltyProgram.description = this.translate.instant('LOYALTY.PROGRAM_DESCRIPTION');
    }
  }

  getPointsPerZlotyMessage(): string {
    if (!this.loyaltyProgram) return '';
    const points = this.loyaltyProgram.pointsPerZloty;
    const currentLang = this.translate.currentLang;
    let plural = '';
    
    if (currentLang === 'pl') {
      plural = points === 1 ? '' : 'y';
    } else if (currentLang === 'en') {
      plural = points === 1 ? '' : 's';
    }
    
    return this.translate.instant('LOYALTY.POINTS_PER_ZLOTY', { points, plural });
  }

  canAffordReward(reward: LoyaltyReward): boolean {
    if (!this.userPoints) return false;
    return this.userPoints.availablePoints >= reward.pointsCost;
  }

  redeemReward(reward: LoyaltyReward): void {
    if (!this.canAffordReward(reward)) {
      this.openModal({
        type: 'error',
        title: this.translate.instant('LOYALTY.ERROR_NOT_ENOUGH_POINTS'),
        message: this.translate.instant('LOYALTY.ERROR_NOT_ENOUGH_POINTS_MESSAGE')
      });
      return;
    }
    this.pendingReward = reward;
    this.openModal({
      type: 'confirm',
      title: this.translate.instant('LOYALTY.CONFIRM_REDEEM_TITLE'),
      message: this.translate.instant('LOYALTY.CONFIRM_REDEEM_MESSAGE', { points: reward.pointsCost })
    });
  }

  confirmRedeemReward(): void {
    if (!this.pendingReward || this.modalLoading) {
      return;
    }

    this.modalLoading = true;
    const reward = this.pendingReward;

    this.apiService.redeemReward(reward.id).subscribe({
      next: (redemption) => {
        this.modalLoading = false;
        this.pendingReward = null;

        const couponCode = redemption.couponCode || redemption.code;
  const couponDetails: Record<string, any> | undefined = redemption.couponDetails as Record<string, any> | undefined;
  const validToRaw = couponDetails ? (couponDetails['valid_to'] ?? couponDetails['validTo']) : null;
        const expiryText = validToRaw ? new Date(validToRaw).toLocaleDateString('pl-PL') : null;

        this.openModal({
          type: 'success',
          title: this.translate.instant('LOYALTY.SUCCESS_TITLE'),
          message: this.translate.instant('LOYALTY.SUCCESS_MESSAGE'),
          couponCode,
          expiryText
        });

        if (couponCode) {
          this.copyCouponToClipboard(couponCode, true);
        }

        this.loadData();
        this.redeemedRewards$ = this.apiService.getMyRedeemedRewards();
        this.activeTab = 'myRewards';
      },
      error: (err) => {
        console.error('Error redeeming reward:', err);
        const errorMsg = err.error?.error || this.translate.instant('LOYALTY.ERROR_REDEEM');
        this.modalLoading = false;
        this.openModal({
          type: 'error',
          title: this.translate.instant('COMMON.ERROR'),
          message: errorMsg
        });
      }
    });
  }

  formatRewardValue(reward: LoyaltyReward): string {
    if (reward.isPercentage) {
      return `${reward.rewardValue}% zniżki`;
    } else {
      return `${reward.rewardValue} PLN zniżki`;
    }
  }

  showCouponCodeModal(code?: string, rewardName?: string): void {
    if (!code) {
      return;
    }

    this.openModal({
      type: 'code',
      title: rewardName ? `Kod dla ${rewardName}` : 'Kod kuponu',
      message: 'Skopiuj kod i wykorzystaj go podczas składania zamówienia.',
      couponCode: code,
      expiryText: null
    });
  }

  copyCouponToClipboard(code?: string, silent = false): void {
    if (!code || typeof navigator === 'undefined' || !navigator.clipboard) {
      if (!silent) {
        this.copyFeedbackSuccess = false;
        this.copyFeedback = 'Kopiowanie jest niedostępne w tej przeglądarce.';
      }
      return;
    }

    navigator.clipboard.writeText(code)
      .then(() => {
        this.copyFeedbackSuccess = true;
        this.copyFeedback = this.translate.instant('LOYALTY.COPIED_SUCCESS');
      })
      .catch(() => {
        this.copyFeedbackSuccess = false;
        this.copyFeedback = this.translate.instant('LOYALTY.COPIED_ERROR');
      });

    if (silent) {
      this.copyFeedbackSuccess = true;
      this.copyFeedback = this.translate.instant('LOYALTY.COPIED_SUCCESS');
    }
  }

  closeModal(): void {
    this.modalState = { open: false };
    this.pendingReward = null;
    this.modalLoading = false;
    this.copyFeedback = '';
    this.copyFeedbackSuccess = true;
  }

  private openModal(state: Partial<ModalState>): void {
    this.copyFeedback = '';
    this.copyFeedbackSuccess = true;
    this.modalState = { open: true, ...state };
  }
}
