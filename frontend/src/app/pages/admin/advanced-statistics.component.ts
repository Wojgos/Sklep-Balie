import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { ApiService } from '../../services/api.service';
import {
  MonthlyStatistics,
  QuarterlyStatistics,
  YearlyStatistics,
  DashboardOverview,
  CategoryPerformanceReport,
  TopProductsReport,
  MonthlyData,
  YearlyData,
  CategoryPerformance,
  TopProduct
} from '../../models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-advanced-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header with Quick Stats -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-3xl font-bold mb-4">📊 {{ 'STATISTICS.TITLE' | translate }}</h2>
            <p class="text-blue-100">{{ 'STATISTICS.SUBTITLE' | translate }}</p>
          </div>
          <button
            (click)="generatePDF()"
            [disabled]="isGeneratingPDF"
            class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg *ngIf="!isGeneratingPDF" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <svg *ngIf="isGeneratingPDF" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isGeneratingPDF ? ('STATISTICS.GENERATING_PDF' | translate) : ('STATISTICS.EXPORT_PDF' | translate) }}
          </button>
        </div>
      </div>

      <!-- Dashboard Overview -->
      <div *ngIf="dashboardData$ | async as dashboard" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Today -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium opacity-90">{{ 'STATISTICS.TODAY' | translate }}</span>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-3xl font-bold">{{dashboard.today.revenue | number:'1.2-2'}} PLN</p>
          <p class="text-sm opacity-75 mt-1">{{dashboard.today.orders_count}} {{ 'STATISTICS.ORDERS' | translate }}</p>
        </div>

        <!-- Current Month -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium opacity-90">{{ 'STATISTICS.CURRENT_MONTH' | translate }}</span>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <p class="text-3xl font-bold">{{dashboard.current_month.revenue | number:'1.2-2'}} PLN</p>
          <p class="text-sm opacity-75 mt-1">
            {{dashboard.current_month.orders_count}} {{ 'STATISTICS.ORDERS' | translate }}
            <span [class]="dashboard.current_month.growth_rate >= 0 ? 'text-green-200' : 'text-red-200'" class="ml-2">
              {{dashboard.current_month.growth_rate >= 0 ? '↗' : '↘'}} {{dashboard.current_month.growth_rate | number:'1.1-1'}}%
            </span>
          </p>
        </div>

        <!-- Current Year -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium opacity-90">{{ 'STATISTICS.CURRENT_YEAR' | translate }}</span>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <p class="text-3xl font-bold">{{dashboard.current_year.revenue | number:'1.2-2'}} PLN</p>
          <p class="text-sm opacity-75 mt-1">{{dashboard.current_year.orders_count}} {{ 'STATISTICS.ORDERS' | translate }}</p>
        </div>

        <!-- Previous Month -->
        <div class="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium opacity-90">{{ 'STATISTICS.PREVIOUS_MONTH' | translate }}</span>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-3xl font-bold">{{dashboard.previous_month.revenue | number:'1.2-2'}} PLN</p>
          <p class="text-sm opacity-75 mt-1">{{dashboard.previous_month.orders_count}} {{ 'STATISTICS.ORDERS' | translate }}</p>
        </div>
      </div>

      <!-- Tabs for different views -->
      <div class="border-b border-border">
        <nav class="flex space-x-4" aria-label="Analytics Tabs">
          <button
            *ngFor="let tab of analyticsTabs"
            (click)="switchTab(tab.id)"
            [class]="activeAnalyticsTab === tab.id 
              ? 'border-primary text-primary border-b-2 py-3 px-2 text-sm font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-3 px-2 text-sm font-medium'"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Monthly Analysis Tab -->
      <div *ngIf="activeAnalyticsTab === 'monthly'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-2xl font-semibold">{{ 'STATISTICS.MONTHLY_ANALYTICS' | translate }}</h3>
          <div class="flex items-center gap-2">
            <input 
              type="date" 
              [(ngModel)]="monthlyStartDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <span class="text-muted-foreground">-</span>
            <input 
              type="date" 
              [(ngModel)]="monthlyEndDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <button
              (click)="loadMonthlyData()"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {{ 'STATISTICS.GENERATE_ANALYSIS' | translate }}
            </button>
            <button
              (click)="generateMonthlyPDF()"
              [disabled]="isGeneratingPDF || !(monthlyStats$ | async)"
              class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div *ngIf="monthlyStats$ | async as monthly">
          <!-- View Selection Buttons -->
          <div class="bg-card border border-card-border rounded-lg p-5">
            <p class="text-sm text-muted-foreground mb-4 font-medium">{{ 'STATISTICS.SELECT_VIEW' | translate }}</p>
            <div class="flex flex-wrap gap-3">
              <button
                (click)="toggleMonthlyView('summary')"
                [class]="monthlyActiveViews.includes('summary') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_SUMMARY' | translate }}
              </button>
              <button
                (click)="toggleMonthlyView('bestWorst')"
                [class]="monthlyActiveViews.includes('bestWorst') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_BEST_WORST' | translate }}
              </button>
              <button
                (click)="toggleMonthlyView('revenueChart')"
                [class]="monthlyActiveViews.includes('revenueChart') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_REVENUE_CHART' | translate }}
              </button>
              <button
                (click)="toggleMonthlyView('growthChart')"
                [class]="monthlyActiveViews.includes('growthChart') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_GROWTH_CHART' | translate }}
              </button>
              <button
                (click)="toggleMonthlyView('table')"
                [class]="monthlyActiveViews.includes('table') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_TABLE' | translate }}
              </button>
              <button
                (click)="showAllMonthlyViews()"
                class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
              >
                👁️ {{ 'STATISTICS.SHOW_ALL' | translate }}
              </button>
              <button
                (click)="hideAllMonthlyViews()"
                class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✖️ {{ 'STATISTICS.HIDE_ALL' | translate }}
              </button>
            </div>
          </div>

          <!-- Summary Cards -->
          <div *ngIf="monthlyActiveViews.includes('summary')" class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div class="bg-card border border-card-border rounded-lg p-4">
              <p class="text-sm text-muted-foreground">{{ 'STATISTICS.TOTAL_REVENUE' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ monthly.summary.total_revenue | number:'1.2-2' }} PLN</p>
            </div>
            <div class="bg-card border border-card-border rounded-lg p-4">
              <p class="text-sm text-muted-foreground">{{ 'STATISTICS.TOTAL_ORDERS' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ monthly.summary.total_orders }}</p>
            </div>
            <div class="bg-card border border-card-border rounded-lg p-4">
              <p class="text-sm text-muted-foreground">{{ 'STATISTICS.AVERAGE_ORDER' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ monthly.summary.avg_monthly_revenue | number:'1.2-2' }} PLN</p>
            </div>
            <div class="bg-card border border-card-border rounded-lg p-4">
              <p class="text-sm text-muted-foreground">{{ 'STATISTICS.MONTHS_SHOWN' | translate }}</p>
              <p class="text-2xl font-bold mt-1">{{ monthly.summary.months_count }}</p>
            </div>
          </div>

          <!-- Best and Worst Month -->
          <div *ngIf="monthlyActiveViews.includes('bestWorst')" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div *ngIf="monthly.best_month" class="bg-green-50 border border-green-200 rounded-lg p-6">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                <h4 class="text-lg font-semibold text-green-800">{{ 'STATISTICS.BEST_MONTH' | translate }}</h4>
              </div>
              <p class="text-2xl font-bold text-green-900">{{ monthly.best_month.month_name }}</p>
              <p class="text-xl text-green-700 mt-2">{{ monthly.best_month.revenue | number:'1.2-2' }} PLN</p>
              <p class="text-sm text-green-600 mt-1">{{ monthly.best_month.orders_count }} {{ 'STATISTICS.ORDERS' | translate }}</p>
            </div>

            <div *ngIf="monthly.worst_month" class="bg-red-50 border border-red-200 rounded-lg p-6">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                <h4 class="text-lg font-semibold text-red-800">{{ 'STATISTICS.WORST_MONTH' | translate }}</h4>
              </div>
              <p class="text-2xl font-bold text-red-900">{{ monthly.worst_month.month_name }}</p>
              <p class="text-xl text-red-700 mt-2">{{ monthly.worst_month.revenue | number:'1.2-2' }} PLN</p>
              <p class="text-sm text-red-600 mt-1">{{ monthly.worst_month.orders_count }} {{ 'STATISTICS.ORDERS' | translate }}</p>
            </div>
          </div>

          <!-- Monthly Revenue Chart -->
          <div *ngIf="monthlyActiveViews.includes('revenueChart')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.MONTHLY_REVENUE_CHART' | translate }}</h4>
            <div style="height: 300px; position: relative;">
              <canvas #monthlyRevenueChart></canvas>
            </div>
          </div>

          <!-- Monthly Growth Chart -->
          <div *ngIf="monthlyActiveViews.includes('growthChart')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.MONTHLY_GROWTH_CHART' | translate }}</h4>
            <div style="height: 300px; position: relative;">
              <canvas #monthlyGrowthChart></canvas>
            </div>
          </div>

          <!-- Monthly Data Table -->
          <div *ngIf="monthlyActiveViews.includes('table')" class="bg-card border border-card-border rounded-lg overflow-hidden mt-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'STATISTICS.MONTH' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.REVENUE' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.ORDERS' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.AVERAGE_ORDER' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.GROWTH' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let month of monthly.monthly_data" class="border-t border-card-border hover:bg-muted/50">
                    <td class="px-4 py-3 font-medium">{{ month.month_name }}</td>
                    <td class="px-4 py-3 text-right">{{ month.revenue | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">{{ month.orders_count }}</td>
                    <td class="px-4 py-3 text-right">{{ month.avg_order_value | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">
                      <span *ngIf="month.growth_rate !== null" 
                            [class]="month.growth_rate >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                        {{ month.growth_rate >= 0 ? '+' : '' }}{{ month.growth_rate | number:'1.2-2' }}%
                      </span>
                      <span *ngIf="month.growth_rate === null" class="text-muted-foreground">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Yearly Analysis Tab -->
      <div *ngIf="activeAnalyticsTab === 'yearly'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-2xl font-semibold">Analiza Roczna (ostatnie 5 lat)</h3>
          <div class="flex items-center gap-2">
            <button
              (click)="loadYearlyData()"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Odśwież
            </button>
            <button
              (click)="generateYearlyPDF()"
              [disabled]="isGeneratingPDF || !(yearlyStats$ | async)"
              class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div *ngIf="yearlyStats$ | async as yearly">
          <!-- View Selection Buttons -->
          <div class="bg-card border border-card-border rounded-lg p-5">
            <p class="text-sm text-muted-foreground mb-4 font-medium">{{ 'STATISTICS.SELECT_VIEW' | translate }}</p>
            <div class="flex flex-wrap gap-3">
              <button
                (click)="toggleYearlyView('chart')"
                [class]="yearlyActiveViews.includes('chart') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_REVENUE_CHART' | translate }}
              </button>
              <button
                (click)="toggleYearlyView('table')"
                [class]="yearlyActiveViews.includes('table') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_TABLE' | translate }}
              </button>
              <button
                (click)="showAllYearlyViews()"
                class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
              >
                {{ 'STATISTICS.SHOW_ALL' | translate }}
              </button>
              <button
                (click)="hideAllYearlyViews()"
                class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.HIDE_ALL' | translate }}
              </button>
            </div>
          </div>

          <!-- Yearly Revenue Chart -->
          <div *ngIf="yearlyActiveViews.includes('chart')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.YEARLY_REVENUE_CHART' | translate }}</h4>
            <div style="height: 300px; position: relative;">
              <canvas #yearlyRevenueChart></canvas>
            </div>
          </div>

          <!-- Yearly Data Table -->
          <div *ngIf="yearlyActiveViews.includes('table')" class="bg-card border border-card-border rounded-lg overflow-hidden mt-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'STATISTICS.YEAR' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.REVENUE' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.ORDERS' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.AVERAGE_ORDER' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.GROWTH_RATE' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let year of yearly.yearly_data" class="border-t border-card-border hover:bg-muted/50">
                    <td class="px-4 py-3 font-bold text-lg">{{ year.year }}</td>
                    <td class="px-4 py-3 text-right font-semibold">{{ year.revenue | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">{{ year.orders_count }}</td>
                    <td class="px-4 py-3 text-right">{{ year.avg_order_value | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">
                      <span *ngIf="year.growth_rate !== null" 
                            [class]="year.growth_rate >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                        {{ year.growth_rate >= 0 ? '+' : '' }}{{ year.growth_rate | number:'1.2-2' }}%
                        <span class="text-sm block">{{ year.growth_amount | number:'1.2-2' }} PLN</span>
                      </span>
                      <span *ngIf="year.growth_rate === null" class="text-muted-foreground">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Performance Tab -->
      <div *ngIf="activeAnalyticsTab === 'categories'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-2xl font-semibold">{{ 'STATISTICS.CATEGORY_TITLE' | translate }}</h3>
          <div class="flex items-center gap-2">
            <input 
              type="date" 
              [(ngModel)]="categoryStartDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <span class="text-muted-foreground">-</span>
            <input 
              type="date" 
              [(ngModel)]="categoryEndDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <button
              (click)="loadCategoryData()"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {{ 'STATISTICS.APPLY_FILTERS' | translate }}
            </button>
            <button
              (click)="generateCategoryPDF()"
              [disabled]="isGeneratingPDF || !(categoryPerformance$ | async)"
              class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div *ngIf="categoryPerformance$ | async as categories">
          <!-- View Selection Buttons -->
          <div class="bg-card border border-card-border rounded-lg p-5">
            <p class="text-sm text-muted-foreground mb-4 font-medium">{{ 'STATISTICS.SELECT_VIEW' | translate }}</p>
            <div class="flex flex-wrap gap-3">
              <button
                (click)="toggleCategoryView('summary')"
                [class]="categoryActiveViews.includes('summary') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_SUMMARY' | translate }}
              </button>
              <button
                (click)="toggleCategoryView('chart')"
                [class]="categoryActiveViews.includes('chart') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_CHART' | translate }}
              </button>
              <button
                (click)="toggleCategoryView('table')"
                [class]="categoryActiveViews.includes('table') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_TABLE' | translate }}
              </button>
              <button
                (click)="showAllCategoryViews()"
                class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
              >
                {{ 'STATISTICS.SHOW_ALL' | translate }}
              </button>
              <button
                (click)="hideAllCategoryViews()"
                class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.HIDE_ALL' | translate }}
              </button>
            </div>
          </div>

          <!-- Summary Card -->
          <div *ngIf="categoryActiveViews.includes('summary')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.CATEGORY_SUMMARY' | translate }}</h4>
            <p class="text-sm text-muted-foreground">
              {{ 'STATISTICS.TOTAL_CATEGORY_REVENUE' | translate }}: 
              <span class="font-bold text-foreground">
                {{ (categories.summary?.total_revenue || categories.total_revenue) | number:'1.2-2' }} PLN
              </span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              {{ 'STATISTICS.ACTIVE_CATEGORIES' | translate }}: 
              <span class="font-bold text-foreground">
                {{ categories.summary?.active_categories || categories.categories.length }}
              </span>
            </p>
            <p *ngIf="categories.summary?.total_orders" class="text-sm text-muted-foreground mt-2">
              {{ 'STATISTICS.TOTAL_ORDERS' | translate }}: 
              <span class="font-bold text-foreground">
                {{ categories.summary?.total_orders }}
              </span>
            </p>
          </div>

          <!-- Category Revenue Distribution Chart -->
          <div *ngIf="categoryActiveViews.includes('chart')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.CATEGORY_CHART' | translate }}</h4>
            <div class="flex justify-center">
              <div style="height: 400px; width: 400px; position: relative;">
                <canvas #categoryChart></canvas>
              </div>
            </div>
          </div>

          <!-- Category Table -->
          <div *ngIf="categoryActiveViews.includes('table')" class="bg-card border border-card-border rounded-lg overflow-hidden mt-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'STATISTICS.CATEGORY' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.REVENUE' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.SHARE_PERCENT' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.QUANTITY_SOLD' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.ORDERS' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cat of categories.categories" class="border-t border-card-border hover:bg-muted/50">
                    <td class="px-4 py-3 font-medium">{{ cat.category_name }}</td>
                    <td class="px-4 py-3 text-right font-semibold">{{ cat.revenue | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">
                      <span class="inline-block bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
                        {{ cat.revenue_percentage | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">{{ cat.quantity_sold }} szt.</td>
                    <td class="px-4 py-3 text-right">{{ cat.orders_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products Tab -->
      <div *ngIf="activeAnalyticsTab === 'products'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-2xl font-semibold">{{ 'STATISTICS.PRODUCTS_TITLE' | translate }}</h3>
          <div class="flex items-center gap-2">
            <input 
              type="date" 
              [(ngModel)]="topProductsStartDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <span class="text-muted-foreground">-</span>
            <input 
              type="date" 
              [(ngModel)]="topProductsEndDate"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            />
            <select 
              [(ngModel)]="topProductsLimit"
              class="px-3 py-2 border border-border rounded text-sm bg-background"
            >
              <option [value]="5">Top 5</option>
              <option [value]="10">Top 10</option>
              <option [value]="20">Top 20</option>
              <option [value]="50">Top 50</option>
            </select>
            <button
              (click)="loadTopProducts()"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {{ 'STATISTICS.APPLY_FILTERS' | translate }}
            </button>
            <button
              (click)="generateTopProductsPDF()"
              [disabled]="isGeneratingPDF || !(topProducts$ | async)"
              class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div *ngIf="topProducts$ | async as products">
          <!-- View Selection Buttons -->
          <div class="bg-card border border-card-border rounded-lg p-5">
            <p class="text-sm text-muted-foreground mb-4 font-medium">{{ 'STATISTICS.SELECT_VIEW' | translate }}</p>
            <div class="flex flex-wrap gap-3">
              <button
                (click)="toggleProductView('summary')"
                [class]="productActiveViews.includes('summary') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_SUMMARY' | translate }}
              </button>
              <button
                (click)="toggleProductView('chart')"
                [class]="productActiveViews.includes('chart') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_CHART' | translate }}
              </button>
              <button
                (click)="toggleProductView('table')"
                [class]="productActiveViews.includes('table') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.VIEW_TABLE' | translate }}
              </button>
              <button
                (click)="showAllProductViews()"
                class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
              >
                {{ 'STATISTICS.SHOW_ALL' | translate }}
              </button>
              <button
                (click)="hideAllProductViews()"
                class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ 'STATISTICS.HIDE_ALL' | translate }}
              </button>
            </div>
          </div>

          <!-- Summary Card -->
          <div *ngIf="productActiveViews.includes('summary')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.PRODUCTS_SUMMARY' | translate }}</h4>
            <p class="text-sm text-muted-foreground">{{ 'STATISTICS.DATE_RANGE' | translate }}: <span class="font-bold text-foreground">{{ products.period.start_date | date:'shortDate' }} - {{ products.period.end_date | date:'shortDate' }}</span></p>
            <p class="text-sm text-muted-foreground mt-2">{{ 'STATISTICS.PRODUCTS_COUNT' | translate }}: <span class="font-bold text-foreground">{{ products.top_products.length }}</span></p>
          </div>

          <!-- Top Products Chart -->
          <div *ngIf="productActiveViews.includes('chart')" class="bg-card border border-card-border rounded-lg p-6 mt-6">
            <h4 class="text-lg font-semibold mb-4">{{ 'STATISTICS.TOP_PRODUCTS_CHART' | translate }}</h4>
            <div style="height: 400px; position: relative;">
              <canvas #topProductsChart></canvas>
            </div>
          </div>

          <!-- Products Table -->
          <div *ngIf="productActiveViews.includes('table')" class="bg-card border border-card-border rounded-lg overflow-hidden mt-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'STATISTICS.PRODUCT_NAME' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.REVENUE' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.QUANTITY_SOLD' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.ORDERS' | translate }}</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'STATISTICS.AVERAGE_PRICE' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let product of products.top_products; let i = index" 
                      class="border-t border-card-border hover:bg-muted/50">
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                            [class]="i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-muted text-foreground'">
                        {{ i + 1 }}
                      </span>
                    </td>
                    <td class="px-4 py-3 font-medium">{{ product.product_name }}</td>
                    <td class="px-4 py-3 text-right font-bold text-green-600">{{ product.revenue | number:'1.2-2' }} PLN</td>
                    <td class="px-4 py-3 text-right">{{ product.quantity_sold }} szt.</td>
                    <td class="px-4 py-3 text-right">{{ product.orders_count }}</td>
                    <td class="px-4 py-3 text-right">{{ product.avg_price | number:'1.2-2' }} PLN</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div *ngIf="pdfMessage" class="fixed bottom-4 right-4 z-50 max-w-md">
        <div [class]="pdfMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'" 
             class="text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <svg *ngIf="pdfMessage.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg *ngIf="pdfMessage.type === 'error'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>{{ pdfMessage.text }}</span>
          <button (click)="pdfMessage = null" class="ml-auto">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdvancedStatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('monthlyRevenueChart') monthlyRevenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyGrowthChart') monthlyGrowthChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyRevenueChart') yearlyRevenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChart') topProductsChartRef!: ElementRef<HTMLCanvasElement>;

  monthlyRevenueChart?: Chart;
  monthlyGrowthChart?: Chart;
  yearlyRevenueChart?: Chart;
  categoryChart?: Chart;
  topProductsChart?: Chart;

  dashboardData$!: Observable<DashboardOverview>;
  monthlyStats$!: Observable<MonthlyStatistics>;
  yearlyStats$!: Observable<YearlyStatistics>;
  categoryPerformance$!: Observable<CategoryPerformanceReport>;
  topProducts$!: Observable<TopProductsReport>;

  activeAnalyticsTab: 'monthly' | 'yearly' | 'categories' | 'products' = 'monthly';

  monthlyActiveViews: string[] = ['summary', 'revenueChart', 'table'];
  yearlyActiveViews: string[] = ['chart', 'table'];
  categoryActiveViews: string[] = ['summary', 'chart'];
  productActiveViews: string[] = ['summary', 'chart', 'table'];

  monthlyStartDate: string = '';
  monthlyEndDate: string = '';
  categoryStartDate: string = '';
  categoryEndDate: string = '';
  topProductsStartDate: string = '';
  topProductsEndDate: string = '';
  topProductsLimit: number = 10;

  analyticsTabs: Array<{id: 'monthly' | 'yearly' | 'categories' | 'products', label: string}> = [];

  isGeneratingPDF = false;
  pdfMessage: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {
    this.initializeAnalyticsTabs();
    const today = new Date();
    const twelveMonthsAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.monthlyStartDate = twelveMonthsAgo.toISOString().split('T')[0];
    this.monthlyEndDate = today.toISOString().split('T')[0];
    this.categoryStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    this.categoryEndDate = today.toISOString().split('T')[0];
    this.topProductsStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    this.topProductsEndDate = today.toISOString().split('T')[0];
  }

  initializeAnalyticsTabs(): void {
    this.analyticsTabs = [
      { id: 'monthly' as const, label: this.translate.instant('STATISTICS.TAB_MONTHLY') },
      { id: 'yearly' as const, label: this.translate.instant('STATISTICS.TAB_YEARLY') },
      { id: 'categories' as const, label: this.translate.instant('STATISTICS.TAB_CATEGORIES') },
      { id: 'products' as const, label: this.translate.instant('STATISTICS.TAB_PRODUCTS') },
    ];
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initializeAnalyticsTabs();
        this.reloadChartsWithNewLanguage();
      });

    this.loadDashboardData();
    this.loadDataForTab(this.activeAnalyticsTab);
  }

  reloadChartsWithNewLanguage(): void {
    if (this.activeAnalyticsTab === 'monthly' && this.monthlyRevenueChartRef) {
      this.monthlyStats$.subscribe(data => {
        this.createMonthlyRevenueChart(data);
        this.createMonthlyGrowthChart(data);
      });
    } else if (this.activeAnalyticsTab === 'yearly' && this.yearlyRevenueChartRef) {
      this.yearlyStats$.subscribe(data => {
        this.createYearlyRevenueChart(data);
      });
    } else if (this.activeAnalyticsTab === 'categories' && this.categoryChartRef) {
      this.categoryPerformance$.subscribe(data => {
        this.createCategoryChart(data);
      });
    } else if (this.activeAnalyticsTab === 'products' && this.topProductsChartRef) {
      this.topProducts$.subscribe(data => {
        this.createTopProductsChart(data);
      });
    }
  }

  ngAfterViewInit(): void {
  }

  switchTab(tabId: 'monthly' | 'yearly' | 'categories' | 'products'): void {
    this.activeAnalyticsTab = tabId;
    this.loadDataForTab(tabId);
  }

  loadDataForTab(tabId: 'monthly' | 'yearly' | 'categories' | 'products'): void {
    switch(tabId) {
      case 'monthly':
        this.loadMonthlyData();
        break;
      case 'yearly':
        this.loadYearlyData();
        break;
      case 'categories':
        this.loadCategoryData();
        break;
      case 'products':
        this.loadTopProducts();
        break;
    }
  }

  loadDashboardData(): void {
    this.dashboardData$ = this.apiService.getDashboardOverview();
  }

  loadMonthlyData(): void {
    const startDate = new Date(this.monthlyStartDate);
    const endDate = new Date(this.monthlyEndDate);
    
    this.monthlyStats$ = this.apiService.getMonthlyStatistics(startDate, endDate);
    
    setTimeout(() => {
      this.monthlyStats$.subscribe(data => {
        this.createMonthlyRevenueChart(data);
        this.createMonthlyGrowthChart(data);
      });
    }, 100);
  }

  loadYearlyData(): void {
    this.yearlyStats$ = this.apiService.getYearlyStatistics();
    
    setTimeout(() => {
      this.yearlyStats$.subscribe(data => {
        this.createYearlyRevenueChart(data);
      });
    }, 100);
  }

  loadCategoryData(): void {
    const startDate = new Date(this.categoryStartDate);
    const endDate = new Date(this.categoryEndDate);
    
    this.categoryPerformance$ = this.apiService.getCategoryPerformance(startDate, endDate);
    
    setTimeout(() => {
      this.categoryPerformance$.subscribe(data => {
        this.createCategoryChart(data);
      });
    }, 100);
  }

  loadTopProducts(): void {
    const startDate = new Date(this.topProductsStartDate);
    const endDate = new Date(this.topProductsEndDate);
    
    this.topProducts$ = this.apiService.getTopProducts(startDate, endDate, this.topProductsLimit);
    
    setTimeout(() => {
      this.topProducts$.subscribe(data => {
        this.createTopProductsChart(data);
      });
    }, 100);
  }

  createMonthlyRevenueChart(data: MonthlyStatistics): void {
    if (!this.monthlyRevenueChartRef) return;

    if (this.monthlyRevenueChart) {
      this.monthlyRevenueChart.destroy();
    }

    const ctx = this.monthlyRevenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.monthlyRevenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.monthly_data.map((m: MonthlyData) => m.month_name),
        datasets: [
          {
            label: this.translate.instant('STATISTICS.REVENUE_PLN'),
            data: data.monthly_data.map((m: MonthlyData) => m.revenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: this.translate.instant('STATISTICS.ORDERS_COUNT'),
            data: data.monthly_data.map((m: MonthlyData) => m.orders_count),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: this.translate.instant('STATISTICS.REVENUE_PLN')
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: this.translate.instant('STATISTICS.ORDERS_COUNT')
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        }
      }
    });
  }

  createMonthlyGrowthChart(data: MonthlyStatistics): void {
    if (!this.monthlyGrowthChartRef) return;

    if (this.monthlyGrowthChart) {
      this.monthlyGrowthChart.destroy();
    }

    const ctx = this.monthlyGrowthChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.monthlyGrowthChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.monthly_data.map((m: MonthlyData) => m.month_name),
        datasets: [{
          label: this.translate.instant('STATISTICS.GROWTH_RATE'),
          data: data.monthly_data.map((m: MonthlyData) => m.growth_rate || 0),
          backgroundColor: data.monthly_data.map((m: MonthlyData) => 
            (m.growth_rate || 0) >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
          ),
          borderColor: data.monthly_data.map((m: MonthlyData) => 
            (m.growth_rate || 0) >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translate.instant('STATISTICS.GROWTH_RATE_PERCENT')
            }
          }
        }
      }
    });
  }

  createYearlyRevenueChart(data: YearlyStatistics): void {
    if (!this.yearlyRevenueChartRef) return;

    if (this.yearlyRevenueChart) {
      this.yearlyRevenueChart.destroy();
    }

    const ctx = this.yearlyRevenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.yearlyRevenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.yearly_data.map((y: YearlyData) => y.year.toString()),
        datasets: [{
          label: this.translate.instant('STATISTICS.YEARLY_REVENUE_PLN'),
          data: data.yearly_data.map((y: YearlyData) => y.revenue),
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translate.instant('STATISTICS.REVENUE_PLN')
            }
          }
        }
      }
    });
  }

  createCategoryChart(data: CategoryPerformanceReport): void {
    if (!this.categoryChartRef) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(147, 51, 234, 0.8)',
      'rgba(236, 72, 153, 0.8)',
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.categories.map((c: CategoryPerformance) => c.category_name),
        datasets: [{
          label: this.translate.instant('STATISTICS.REVENUE'),
          data: data.categories.map((c: CategoryPerformance) => c.revenue),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toFixed(2)} PLN (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  createTopProductsChart(data: TopProductsReport): void {
    if (!this.topProductsChartRef) return;

    if (this.topProductsChart) {
      this.topProductsChart.destroy();
    }

    const ctx = this.topProductsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const topTen = data.top_products.slice(0, 10);

    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topTen.map((p: TopProduct) => p.product_name),
        datasets: [{
          label: this.translate.instant('STATISTICS.REVENUE_PLN'),
          data: topTen.map((p: TopProduct) => p.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translate.instant('STATISTICS.REVENUE_PLN')
            }
          }
        }
      }
    });
  }

  toggleMonthlyView(view: string): void {
    const index = this.monthlyActiveViews.indexOf(view);
    if (index > -1) {
      this.monthlyActiveViews.splice(index, 1);
    } else {
      this.monthlyActiveViews.push(view);
      setTimeout(() => {
        this.monthlyStats$.subscribe(data => {
          if (view === 'revenueChart') {
            this.createMonthlyRevenueChart(data);
          } else if (view === 'growthChart') {
            this.createMonthlyGrowthChart(data);
          }
        });
      }, 100);
    }
  }

  showAllMonthlyViews(): void {
    this.monthlyActiveViews = ['summary', 'bestWorst', 'revenueChart', 'growthChart', 'table'];
    setTimeout(() => {
      this.monthlyStats$.subscribe(data => {
        this.createMonthlyRevenueChart(data);
        this.createMonthlyGrowthChart(data);
      });
    }, 100);
  }

  hideAllMonthlyViews(): void {
    this.monthlyActiveViews = [];
  }

  toggleYearlyView(view: string): void {
    const index = this.yearlyActiveViews.indexOf(view);
    if (index > -1) {
      this.yearlyActiveViews.splice(index, 1);
    } else {
      this.yearlyActiveViews.push(view);
      if (view === 'chart') {
        setTimeout(() => {
          this.yearlyStats$.subscribe(data => {
            this.createYearlyRevenueChart(data);
          });
        }, 100);
      }
    }
  }

  showAllYearlyViews(): void {
    this.yearlyActiveViews = ['chart', 'table'];
    setTimeout(() => {
      this.yearlyStats$.subscribe(data => {
        this.createYearlyRevenueChart(data);
      });
    }, 100);
  }

  hideAllYearlyViews(): void {
    this.yearlyActiveViews = [];
  }

  toggleCategoryView(view: string): void {
    const index = this.categoryActiveViews.indexOf(view);
    if (index > -1) {
      this.categoryActiveViews.splice(index, 1);
    } else {
      this.categoryActiveViews.push(view);
      if (view === 'chart') {
        setTimeout(() => {
          this.categoryPerformance$.subscribe(data => {
            this.createCategoryChart(data);
          });
        }, 100);
      }
    }
  }

  showAllCategoryViews(): void {
    this.categoryActiveViews = ['summary', 'chart', 'table'];
    setTimeout(() => {
      this.categoryPerformance$.subscribe(data => {
        this.createCategoryChart(data);
      });
    }, 100);
  }

  hideAllCategoryViews(): void {
    this.categoryActiveViews = [];
  }

  toggleProductView(view: string): void {
    const index = this.productActiveViews.indexOf(view);
    if (index > -1) {
      this.productActiveViews.splice(index, 1);
    } else {
      this.productActiveViews.push(view);
      if (view === 'chart') {
        setTimeout(() => {
          this.topProducts$.subscribe(data => {
            this.createTopProductsChart(data);
          });
        }, 100);
      }
    }
  }

  showAllProductViews(): void {
    this.productActiveViews = ['summary', 'chart', 'table'];
    setTimeout(() => {
      this.topProducts$.subscribe(data => {
        this.createTopProductsChart(data);
      });
    }, 100);
  }

  hideAllProductViews(): void {
    this.productActiveViews = [];
  }

  generatePDF(): void {
    this.isGeneratingPDF = true;
    this.pdfMessage = null;

    this.apiService.generateStatisticsPDF().subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `statistics_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'success', 
          text: this.translate.instant('STATISTICS.PDF_SUCCESS') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      },
      error: (error) => {
        console.error('PDF generation error:', error);
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'error', 
          text: this.translate.instant('STATISTICS.PDF_ERROR') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      }
    });
  }

  generateMonthlyPDF(): void {
    this.isGeneratingPDF = true;
    this.pdfMessage = null;

    const startDate = new Date(this.monthlyStartDate);
    const endDate = new Date(this.monthlyEndDate);

    this.apiService.generateMonthlyStatisticsPDF(startDate, endDate).subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monthly_statistics_${this.monthlyStartDate}_${this.monthlyEndDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'success', 
          text: this.translate.instant('STATISTICS.PDF_SUCCESS') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      },
      error: (error) => {
        console.error('Monthly PDF generation error:', error);
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'error', 
          text: this.translate.instant('STATISTICS.PDF_ERROR') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      }
    });
  }

  generateYearlyPDF(): void {
    this.isGeneratingPDF = true;
    this.pdfMessage = null;

    this.apiService.generateYearlyStatisticsPDF().subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `yearly_statistics_${new Date().getFullYear()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'success', 
          text: this.translate.instant('STATISTICS.PDF_SUCCESS') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      },
      error: (error) => {
        console.error('Yearly PDF generation error:', error);
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'error', 
          text: this.translate.instant('STATISTICS.PDF_ERROR') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      }
    });
  }

  generateCategoryPDF(): void {
    this.isGeneratingPDF = true;
    this.pdfMessage = null;

    const startDate = new Date(this.categoryStartDate);
    const endDate = new Date(this.categoryEndDate);

    this.apiService.generateCategoryPerformancePDF(startDate, endDate).subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `category_performance_${this.categoryStartDate}_${this.categoryEndDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'success', 
          text: this.translate.instant('STATISTICS.PDF_SUCCESS') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      },
      error: (error) => {
        console.error('Category PDF generation error:', error);
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'error', 
          text: this.translate.instant('STATISTICS.PDF_ERROR') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      }
    });
  }

  generateTopProductsPDF(): void {
    this.isGeneratingPDF = true;
    this.pdfMessage = null;

    const startDate = new Date(this.topProductsStartDate);
    const endDate = new Date(this.topProductsEndDate);

    this.apiService.generateTopProductsPDF(startDate, endDate, this.topProductsLimit).subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `top_products_${this.topProductsStartDate}_${this.topProductsEndDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'success', 
          text: this.translate.instant('STATISTICS.PDF_SUCCESS') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      },
      error: (error) => {
        console.error('Top Products PDF generation error:', error);
        this.isGeneratingPDF = false;
        this.pdfMessage = { 
          type: 'error', 
          text: this.translate.instant('STATISTICS.PDF_ERROR') 
        };
        setTimeout(() => this.pdfMessage = null, 5000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.monthlyRevenueChart?.destroy();
    this.monthlyGrowthChart?.destroy();
    this.yearlyRevenueChart?.destroy();
    this.categoryChart?.destroy();
    this.topProductsChart?.destroy();
  }
}
