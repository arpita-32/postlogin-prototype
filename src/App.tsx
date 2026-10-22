/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { MyBillersView } from './components/MyBillersView';
import { PaymentsView } from './components/PaymentsView';
import { ScheduledPaymentsView } from './components/ScheduledPaymentsView';
import { ComplaintsView } from './components/ComplaintsView';
import { ElectricityFlow } from './components/ElectricityFlow';
import { MobilePrepaidFlow } from './components/MobilePrepaidFlow';
import { MobilePostpaidFlow } from './components/MobilePostpaidFlow';
import { GenericCategoryFlow } from './components/GenericCategoryFlow';
import { TourismFlow } from './components/TourismFlow';
import { LocalCommuteFlow } from './components/LocalCommuteFlow';
import { CreditLineUpiFlow } from './components/CreditLineUpiFlow';
import Loader from './components/Loader';
import { NavTab, CategoryId, PendingBill, SavedBiller } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const triggerLoading = (callback: () => void) => {
    setLoading(true);
    setTimeout(() => {
      callback();
      setLoading(false);
    }, 400);
  };

  // Handle category selection from home screen
  const handleSelectCategory = (catId: CategoryId) => {
    triggerLoading(() => {
      setActiveCategory(catId);
    });
  };

  // Handle pay bill directly from Home table
  const handlePayBillFromHome = (bill: PendingBill) => {
    triggerLoading(() => {
      if (bill.category === 'Electricity') {
        setActiveCategory('electricity');
      } else if (bill.category === 'Mobile Postpaid') {
        setActiveCategory('mobile-postpaid');
      } else if (bill.category === 'Mobile Prepaid') {
        setActiveCategory('mobile-prepaid');
      } else {
        setActiveCategory('water');
      }
    });
  };

  // Handle fetch from My Billers screen
  const handleFetchFromMyBillers = (biller: SavedBiller) => {
    triggerLoading(() => {
      if (biller.billerName.toLowerCase().includes('electricity')) {
        setActiveCategory('electricity');
      } else if (biller.billerName.toLowerCase().includes('credit card')) {
        setActiveCategory('credit-card');
      } else if (biller.billerName.toLowerCase().includes('fastag')) {
        setActiveCategory('fastag');
      } else {
        setActiveCategory('water');
      }
    });
  };

  const handleBackToHome = () => {
    triggerLoading(() => {
      setActiveCategory(null);
    });
  };

  const renderMainContent = () => {
    // If inside a category flow
    if (activeCategory) {
      if (activeCategory === 'electricity') {
        return <ElectricityFlow onBack={handleBackToHome} />;
      }
      if (activeCategory === 'mobile-prepaid') {
        return <MobilePrepaidFlow onBack={handleBackToHome} />;
      }
      if (activeCategory === 'mobile-postpaid') {
        return <MobilePostpaidFlow onBack={handleBackToHome} />;
      }
      if (activeCategory === 'tourism') {
        return <TourismFlow onBack={handleBackToHome} />;
      }
      if (activeCategory === 'local-commute') {
        return <LocalCommuteFlow onBack={handleBackToHome} />;
      }
      if (activeCategory === 'credit-line-upi') {
        return <CreditLineUpiFlow onBack={handleBackToHome} />;
      }
      return <GenericCategoryFlow categoryId={activeCategory} onBack={handleBackToHome} />;
    }

    // Tab-based navigation
    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            onSelectCategory={handleSelectCategory}
            onPayBillFromHome={handlePayBillFromHome}
          />
        );
      case 'my-billers':
        return <MyBillersView onFetchBiller={handleFetchFromMyBillers} />;
      case 'payments':
        return <PaymentsView />;
      case 'scheduled':
        return <ScheduledPaymentsView />;
      case 'complaints':
        return <ComplaintsView />;
      default:
        return (
          <HomeView
            onSelectCategory={handleSelectCategory}
            onPayBillFromHome={handlePayBillFromHome}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-800 font-sans antialiased selection:bg-orange-100 selection:text-orange-900">
      {loading && <Loader />}
      {/* Top Header */}
      <Header
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={() => alert('Logged out successfully')}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex flex-1 w-full overflow-hidden pt-[78px]">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            triggerLoading(() => {
              setCurrentTab(tab);
              setActiveCategory(null); // reset category when switching main nav tabs
            });
          }}
          collapsed={sidebarCollapsed}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 min-h-[calc(100vh-78px)]">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};
