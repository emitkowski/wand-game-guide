<?php

namespace App\Utils\ApiResponse\Laravel;

use App\Utils\ApiResponse\Serializer\Serializer;
use Illuminate\Support\ServiceProvider;
use League\Fractal\Manager;

class ResponseServiceProvider extends ServiceProvider
{
    /**
     * Register the service provider.
     *
     * @return void
     */
    public function boot()
    {
        $response = $this->bootResponse();
        $this->registerMacro($response);
    }

    /**
     * Override this to use your own serializer.
     *
     * @return Serializer
     */
    protected function getSerializer()
    {
        return new Serializer();
    }

    /**
     * Boot response
     *
     * @return Response
     */
    protected function bootResponse()
    {
        $manager = new Manager;

        // Custom serializer because DataArraySerializer doesn't provide the opportunity to change the resource key
        $manager->setSerializer($this->getSerializer());

        //Get includes from request
        $includes = $this->app['Illuminate\Http\Request']->get('include');

        //If includes is not already a array
        if (!is_array($includes)) {
            $includes = explode(',', $includes);
        }

        // Are we going to try and include embedded data?
        $manager->parseIncludes($includes);

        // Return the Response object
        $response = new Response($manager);

        //Set the response instance properly
        $this->app->instance('App\Utils\ApiResponse\Contracts\Response', $response);

        return $response;
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Register response macro
     *
     * @param Response $response
     * @deprecated We still register macro for backward compatibility, but DO NOT USE THIS MACRO ANYMORE !
     */
    private function registerMacro($response)
    {
        \Response::macro('api', function () use ($response) {
            return $response;
        });
    }
}
