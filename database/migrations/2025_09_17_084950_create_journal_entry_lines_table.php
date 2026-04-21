<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('description')->nullable();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);

            // Optional references to external tables (only create constraints if tables exist)
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('partner_agency_id')->nullable();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->unsignedBigInteger('ticket_booking_id')->nullable();
            $table->unsignedBigInteger('financial_document_id')->nullable();

            $table->timestamps();

            $table->index(['account_id', 'customer_id']);
            $table->index(['customer_id']);
            $table->index(['partner_agency_id']);
            $table->index(['employee_id']);
            $table->index(['ticket_booking_id']);
            $table->index(['financial_document_id']);

            // Add foreign key constraints only if referenced tables exist
            if (Schema::hasTable('customers')) {
                $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            }
            if (Schema::hasTable('partner_agencies')) {
                $table->foreign('partner_agency_id')->references('id')->on('partner_agencies')->nullOnDelete();
            }
            if (Schema::hasTable('employees')) {
                $table->foreign('employee_id')->references('id')->on('employees')->nullOnDelete();
            }
            if (Schema::hasTable('ticket_bookings')) {
                $table->foreign('ticket_booking_id')->references('id')->on('ticket_bookings')->nullOnDelete();
            }
            if (Schema::hasTable('financial_documents')) {
                $table->foreign('financial_document_id')->references('id')->on('financial_documents')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entry_lines');
    }
};
