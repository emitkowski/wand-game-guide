<?php

namespace App\Models\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Activable
{
    public function getStatusDisplayAttribute(): string
    {
        return $this->status ? 'Active' : 'Inactive';
    }

    public function activate(): bool
    {
        $this->status = 1;
        $this->save();

        return true;
    }

    public function deactivate(): bool
    {
        $this->status = 0;
        $this->save();

        return true;
    }

    public function isActive(): bool
    {
        return (bool) $this->status;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 1);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', 0);
    }
}
