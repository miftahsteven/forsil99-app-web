'use client';

import React, { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const DEFAULT_SITE_KEY = '6Lc2i5UtAAAAAJ5j6TzvLV5W2_LDSbXPXTbg_UWJ';

interface AppRecaptchaProps {
  onChange: (token: string | null) => void;
  onExpired?: () => void;
  className?: string;
}

export const AppRecaptcha = forwardRef<ReCAPTCHA, AppRecaptchaProps>(
  ({ onChange, onExpired, className }, ref) => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || DEFAULT_SITE_KEY;

    return (
      <div className={`flex justify-center my-3 overflow-x-auto ${className || ''}`}>
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={onExpired}
          hl="id"
        />
      </div>
    );
  }
);

AppRecaptcha.displayName = 'AppRecaptcha';
