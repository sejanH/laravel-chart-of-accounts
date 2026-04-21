<?php

namespace Sejan\Finance\Models;

use Sejan\Finance\Enums\JournalEntryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Config;

class JournalEntry extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'reference',
        'title',
        'entry_date',
        'status',
        'source_type',
        'source_id',
        'prepared_by_employee_id',
        'approved_by_employee_id',
        'total_debit',
        'total_credit',
        'posted_at',
        'notes',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'entry_date' => 'date',
        'status' => JournalEntryStatus::class,
        'total_debit' => 'decimal:2',
        'total_credit' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function preparedBy(): BelongsTo
    {
        return $this->belongsTo(Config::get('finance.user_model'), 'prepared_by_employee_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(Config::get('finance.user_model'), 'approved_by_employee_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function financialDocumentPayments(): HasMany
    {
        return $this->hasMany(FinancialDocumentPayment::class);
    }

    public function ticketCharges(): HasMany
    {
        return $this->hasMany(TicketCharge::class);
    }

    public function ticketSettlements(): HasMany
    {
        return $this->hasMany(TicketSettlement::class);
    }
}
