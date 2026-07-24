<?php

namespace App\Utils\ApiResponse\Serializer;

use League\Fractal\Serializer\ArraySerializer;

class Serializer extends ArraySerializer
{
    const RESOURCE_KEY = 'data';

    /**
     * Serialize a collection.
     *
     * @param string $resourceKey
     * @param array $data
     *
     * @return array
     */
    public function collection(?string $resourceKey, array $data): array
    {
        if (is_null($resourceKey)) $resourceKey = static::RESOURCE_KEY;

        return $resourceKey ? [$resourceKey => $data] : $data;
    }

    /**
     * Serialize an item.
     *
     * @param string $resourceKey
     * @param array $data
     *
     * @return array
     */
    public function item(?string $resourceKey, array $data): array
    {
        if (is_null($resourceKey)) $resourceKey = static::RESOURCE_KEY;

        return $resourceKey ? [$resourceKey => $data] : $data;
    }
}
