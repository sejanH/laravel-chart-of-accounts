<?php

namespace Sejan\Finance\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Config;

class JournalEntryLine extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'journal_entry_id',
        'account_id',
        'description',
        'debit',
        'credit',
        'customer_id',
        'partner_agency_id',
        'employee_id',
        'ticket_booking_id',
        'financial_document_id',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function partnerAgency(): BelongsTo
    {
        return $this->belongsTo(PartnerAgency::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Config::get('finance.user_model'));
    }

    public function ticketBooking(): BelongsTo
    {
        return $this->belongsTo(TicketBooking::class);
    }

    public function financialDocument(): BelongsTo
    {
        return $this->belongsTo(FinancialDocument::class);
    }
}
