<?php

namespace App\Models\Mutators;

use Illuminate\Database\Eloquent\Casts\Attribute;

trait UserMutator
{
    /**
     * Email Mutator
     *
     * @return Attribute
     */
    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => $value,
            set: fn(string $value) => strtolower($value)
        );
    }
}
