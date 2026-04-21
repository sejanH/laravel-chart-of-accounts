<?php

return [
    /*
    |--------------------------------------------------------------------------
    | User Model Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the user model used throughout the finance package. This allows
    | you to use your own User model instead of the default Employee model.
    |
    */

    'user_model' => env('FINANCE_USER_MODEL', 'App\\Models\\User'),

    /*
    |--------------------------------------------------------------------------
    | User Table Name
    |--------------------------------------------------------------------------
    |
    | The table name for your user model. This is used in validation rules and
    | foreign key constraints.
    |
    */

    'user_table' => env('FINANCE_USER_TABLE', 'users'),

    /*
    |--------------------------------------------------------------------------
    | User Name Field
    |--------------------------------------------------------------------------
    |
    | The field(s) used to display the user's name. You can use a single field
    | or a combination of fields (e.g., 'name' or 'first_name,last_name').
    |
    */

    'user_name_field' => env('FINANCE_USER_NAME_FIELD', 'name'),
];
