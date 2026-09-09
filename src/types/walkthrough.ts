import React from 'react';

export interface WalkthroughStep {
  id: string;
  targetId?: string; // DOM id to highlight with spotlight
  title: string;
  description: string;
  highlightNote?: string; // Optional emphasis tip or requirement box
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  badge?: string;
  iconName?: 'user' | 'mail' | 'users' | 'camera' | 'sparkles' | 'logIn' | 'plus' | 'store' | 'radio' | 'compass' | 'shield';
}

export interface WalkthroughConfig {
  pageKey: 'register' | 'login' | 'home';
  pageTitle: string;
  steps: WalkthroughStep[];
}

export interface ManualSection {
  id: string;
  title: string;
  category: 'register' | 'login' | 'features' | 'faq';
  summary: string;
  details: string[];
  tips?: string;
  iconName: string;
}
