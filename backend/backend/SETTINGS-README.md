# Site Settings System

This document explains how the site settings system works in the referral application and how each setting affects the frontend.

## Overview

The referral application includes a dynamic settings system that allows administrators to configure various aspects of the application without modifying code. These settings are stored in the database and can be managed through the admin interface.

## Implementation

The settings system consists of:

1. **Backend**:
   - MongoDB model: `SiteSetting` 
   - API controllers and routes for CRUD operations
   - Default settings initialization

2. **Frontend**:
   - `SettingsContext` - A React context provider that fetches and provides settings
   - `GlobalSettings` component - Applies global settings like colors and site title
   - `globalSettings.css` - CSS variables that are dynamically updated
   - Components that consume settings using the `useSettings` hook

## How Settings Are Applied

Settings take effect in several ways:

1. **Colors and Theme**: Primary and secondary colors are set as CSS variables, applied through the `GlobalSettings` component
2. **Site Identity**: Site name, description, etc. are accessed directly in components
3. **Business Rules**: Referral percentages, minimum amounts, etc. are used in business logic
4. **UI Elements**: Various UI components use settings to render appropriately

## Available Settings

| Key | Type | Category | Description | Effect on Frontend |
|-----|------|----------|-------------|-------------------|
| `site_name` | string | general | Name of the site | Changes site title and branding |
| `site_description` | string | general | Short description | Used in meta tags and introductory sections |
| `primary_color` | color | general | Main brand color | Applied to buttons, headers, and accent elements |
| `secondary_color` | color | general | Secondary brand color | Applied to secondary UI elements |
| `maintenance_mode` | boolean | general | Enable maintenance mode | When enabled, shows maintenance page |
| `referral_bonus` | number | referral | Percentage bonus for referrals | Displayed in referral components and calculations |
| `minimum_withdrawal` | number | payment | Minimum withdrawal amount | Enforces minimum withdrawal amount in forms |
| `payment_methods` | json | payment | Available payment methods | Populates payment method options in forms |
| `min_investment` | number | investment | Minimum investment amount | Sets minimum investment threshold |

## Adding New Settings

When adding new settings, follow these steps to ensure they take effect:

1. **Create Setting**: Add the setting in the admin panel with appropriate type and category
2. **Update Components**: Modify components to use the new setting via `useSettings` hook
3. **Apply Effects**: Implement any needed business logic or UI changes

## Example Usage in Components

```jsx
import { useSettings } from '../context/SettingsContext';

const MyComponent = () => {
  const { getSetting } = useSettings();
  
  // Use settings with fallback values
  const minInvestment = getSetting('min_investment', 100);
  const siteName = getSetting('site_name', 'Referral App');
  
  return (
    <div>
      <h1>{siteName}</h1>
      <p>Minimum investment: ${minInvestment}</p>
    </div>
  );
};
```

## Refreshing Settings

The settings context provides a `refreshSettings()` function that can be called to reload settings from the server. This happens automatically when settings are changed in the admin panel. 