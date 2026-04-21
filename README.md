# Sejan Finance Package - How To Guide

This guide covers installation, development workflow, and common operations for the Sejan Finance package.

## Table of Contents

- [Installation](#installation)
- [Local Development](#local-development)
- [Reloading Changes](#reloading-changes)
- [Package Structure](#package-structure)
- [Available Features](#available-features)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Install via Local Path Repository

1. Add the repository to your application's `composer.json`:

```json
"repositories": [
    {
        "type": "vcs",
        "url": "git@github.com:yourusername/finance.git"
    }
]
```

2. Require the package:

```bash
composer require sejan/finance:v1.0.0
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

## Support

For issues or questions:
1. Check this documentation first
2. Review the controller code for usage examples
3. Examine migration files for database structure details
4. Check Laravel's documentation for framework-specific questions

---

**Last Updated**: April 19, 2026
