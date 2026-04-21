# Finance Package - How To Guide

This guide covers installation, development workflow, and common operations for the Sejan Finance package.

## Table of Contents

- [Installation](#installation)
- [Package Structure](#package-structure)
- [Available Features](#available-features)
- [Authorization & Permissions](#authorization--permissions)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Install via Local Path Repository

1. Add the repository to your application's `composer.json`:

```json
"repositories": [
    {
        "type": "vcs",
        "url": "git@github.com:sejanH/laravel-chart-of-accounts.git"
    }
]
```

2. Require the package:

```bash
composer require sejan/laravel-chart-of-accounts:v1.0.0
```
3. Ensure migrations are published:
```bash
php artisan vendor:publish --tag=finance-migrations
php artisan migrate
```

### For View/Asset 
```bash
php artisan vendor:publish --tag=finance-views --force
php artisan vendor:publish --tag=finance-migrations
php artisan vendor:publish --tag=finance-config --force
npm run dev
```

## Package Structure

```
packages/sejan/finance/
├── composer.json                 # Package configuration
├── database/
│   └── migrations/              # Database migrations
├── resources/
│   └── js/
│       └── Pages/
│           └── Finance/         # Frontend pages (Inertia/React)
│               ├── Ledger.jsx
│               └── Voucher/
│                   ├── ChartOfAccounts.jsx
│                   ├── VoucherEntry.jsx
│                   └── VoucherDetailsEntry.jsx
├── routes/
│   ├── api.php                  # API routes
│   └── web.php                  # Web routes
└── src/
    ├── FinanceServiceProvider.php
    ├── Enums/                   # Enumerations
    │   ├── AccountType.php
    │   └── JournalEntryStatus.php
    ├── Http/
    │   └── Controllers/         # Controllers
    │       ├── AccountController.php
    │       ├── AccountingLedgerController.php
    │       ├── JournalEntryController.php
    │       ├── JournalEntryLineController.php
    │       ├── VoucherAccountController.php
    │       ├── VoucherEntryController.php
    │       ├── VoucherPrintController.php
    │       └── VoucherWorkflowController.php
    └── Models/                  # Eloquent models
        ├── Account.php
        ├── JournalEntry.php
        ├── JournalEntryLine.php
        ├── Voucher.php
        ├── VoucherAccount.php
        └── VoucherLine.php
```

---

## Available Features

### Voucher Management
- **Voucher Types**: BPV (Bank Payment), BRV (Bank Receipt), CPV (Cash Payment), CRV (Cash Receipt), JV (Journal Voucher)
- **Voucher Workflow**: Create, update, delete vouchers with header information
- **Voucher Details**: Line items with debit/credit amounts, account codes, and descriptions
- **Voucher Statuses**: Draft, Completed, Cancelled
- **Navigation**: Previous/Next navigation between vouchers
- **Printing**: Print and PDF export for vouchers
- **Auto-numbering**: Automatic voucher number generation based on type and date

### Chart of Accounts
- **Account Types**: Asset, Liability, Equity, Revenue, Expense
- **Account Hierarchy**: Parent-child relationships for organized account structure
- **Account Codes**: Customizable account codes with type-based organization
- **Active/Inactive Status**: Toggle accounts as active or inactive
- **Full CRUD**: Create, read, update, delete accounts with validation

### Frontend Pages (Inertia + React)
- **Voucher Entry**: Main voucher header management with form inputs and voucher list
- **Voucher Details Entry**: Line item entry with debit/credit validation and account selection
- **Chart of Accounts**: Account management interface with inline editing
- **Ledger**: Accounting ledger view

### Controllers

#### Active Controllers (V2)
- `VoucherWorkflowController` - Voucher header management (CRUD, listing, navigation)
- `VoucherPrintController` - Voucher printing and PDF generation
- `VoucherAccountController` - Chart of accounts CRUD operations

#### Legacy Controllers (V1)
- `AccountController` - Legacy account management
- `JournalEntryController` - Legacy journal entry management
- `JournalEntryLineController` - Legacy journal entry line management
- `AccountingLedgerController` - Legacy ledger queries
- `VoucherEntryController` - Legacy voucher management

### Models
- `Voucher` - Voucher header with metadata
- `VoucherAccount` - Chart of accounts
- `VoucherLine` - Voucher line items with debit/credit
- `Account` - Legacy account model
- `JournalEntry` - Legacy journal entry model
- `JournalEntryLine` - Legacy journal entry line model

### Routes

All routes are prefixed with `/finance` and require authentication:

#### Voucher Routes
- `GET /finance/voucher-entry` - List vouchers and show entry form
- `POST /finance/voucher-entry` - Create new voucher
- `PUT /finance/voucher-entry/{voucher}` - Update voucher
- `DELETE /finance/voucher-entry/{voucher}` - Delete voucher
- `GET /finance/voucher-entry/{voucher}/details` - Show voucher details/lines
- `POST /finance/voucher-entry/{voucher}/details` - Add line item to voucher
- `PUT /finance/voucher-entry/{voucher}/details/{voucherLine}` - Update line item
- `DELETE /finance/voucher-entry/{voucher}/details/{voucherLine}` - Delete line item
- `GET /finance/voucher-entry/{voucher}/print` - Print voucher view
- `GET /finance/voucher-entry/{voucher}/pdf` - Download voucher as PDF

#### Chart of Accounts Routes
- `GET /finance/chart-of-accounts` - List accounts and show form
- `POST /finance/chart-of-accounts` - Create new account
- `PUT /finance/chart-of-accounts/{voucherAccount}` - Update account
- `DELETE /finance/chart-of-accounts/{voucherAccount}` - Delete account

---

## Authorization & Permissions

This package uses Laravel's authorization system to control access to finance features. All finance routes require authentication and check for the `finance.manage` permission.

### Required Permissions

| Permission | Description |
|------------|-------------|
| `finance.manage` | Full access to create, update, and delete vouchers and accounts |

### Implementing Authorization in Your Application

You need to define the `finance.manage` gate in your application's `AuthServiceProvider.php`:

#### Option 1: Allow All Authenticated Users
```php
// app/Providers/AuthServiceProvider.php

use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::define('finance.manage', function ($user) {
        return true; // All authenticated users can manage
    });
}
```

#### Option 2: Role-Based Access Control
```php
public function boot(): void
{
    Gate::define('finance.manage', function ($user) {
        return $user->role === 'admin' || $user->role === 'accountant';
    });
}
```

#### Option 3: Using Spatie Laravel Permission
```php
public function boot(): void
{
    Gate::define('finance.manage', function ($user) {
        return $user->hasPermissionTo('manage finance');
    });
}
```

Then assign the permission:
```bash
php artisan permission:create-permission "manage finance"
php artisan permission:assign "manage finance" admin@example.com
```

### Disabling Authorization

If you want to disable authorization checks and allow all authenticated users to manage finance, simply define the gate to always return `true` as shown in Option 1 above.

---

## Troubleshooting 
For issues or questions:
1. Check this documentation first
2. Review the controller code for usage examples
3. Examine migration files for database structure details
4. Check Laravel's documentation for framework-specific questions

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Last Updated**: April 21, 2026
