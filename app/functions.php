<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Get IP Address
 *
 * @return mixed
 */
function getIpAddress()
{
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && $_SERVER['HTTP_X_FORWARDED_FOR']) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}

function string_sanitize($s)
{
    $result = preg_replace("/[^a-zA-Z0-9-._ ]+/", "", html_entity_decode($s, ENT_QUOTES));

    return $result;
}


/**
 * Convert multi-dimensional array into an object or collection object
 *
 * @param array $data
 * @param bool $force_to_single_object
 * @return array|\Illuminate\Support\Collection|object
 */
function cc(array $data, $force_to_single_object = true)
{
    if (!array_key_exists(0, $data)) {
        return json_decode(json_encode($data));
    }

    if ($force_to_single_object === true && count($data) == 1) {
        return json_decode(json_encode($data[0]));
    }

    return json_decode(json_encode($data));
}

/**
 * Get Human Readable File Size
 *
 * @param $bytes
 * @param int $decimals
 * @return string
 */
function human_filesize($bytes, $decimals = 2)
{
    $size = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    $factor = floor((strlen($bytes) - 1) / 3);

    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$size[$factor];
}

/**
 * Create Dir
 *
 * @param $path
 * @return bool
 */
function createDir($path)
{
    try {
        if (!file_exists($path)) {
            mkdir($path);
        }
    } catch (ErrorException $exception) {
        return false;
    }

    return true;
}

/**
 * Delete Dir
 *
 * @param $dirPath
 * @return bool
 */
function deleteDir($dirPath)
{
    if (!is_dir($dirPath)) {
        return false;
    }

    if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
        $dirPath .= '/';
    }
    $files = glob($dirPath . '*', GLOB_MARK);
    foreach ($files as $file) {
        if (is_dir($file)) {
            deleteDir($file);
        } else {
            if (file_exists($file)) {
                unlink($file);
            }
        }
    }

    try {
        rmdir($dirPath);
    } catch (\Exception $e) {
        Log::error("Failed to remove directory: " . $e->getMessage(), [
            'exception' => $e
        ]);
    }

    return true;
}

/**
 * Remove File or Directory
 *
 * @param $path
 * @param bool $dir
 * @return bool
 */
function remove($path, $force_dir = false)
{
    if (is_dir($path)) {
        deleteDir($path);
    } else {
        if (!is_dir($path) && $force_dir === true) {
            $directory = dirname($path);

            deleteDir($directory);
        } else {
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }

    return true;
}

/**
 * Download file without full memory
 *
 * @param $url
 * @param $path
 * @param null $filename
 * @return string
 */
function downloadFileByStream($url, $path, $filename = null, $cli_output = true)
{
    $handle1 = fopen($url, "r");

    $meta_data = stream_get_meta_data($handle1);

    $stream_filename = getAttachmentNameFromStreamMeta($meta_data);

    if (!is_null($stream_filename)) {
        $filename = Str::before($stream_filename, ';');
    }

    if (is_null($filename)) {
        return false;
    }

    $filename = beautify_filename($filename);

    $handle2 = fopen($path . '/' . $filename, "w");

    if ($cli_output) {
        dump('Downloading... ' . $filename);
    }

    stream_copy_to_stream($handle1, $handle2);

    fclose($handle1);
    fclose($handle2);

    return $filename;
}

/**
 * Get Remote Filestream
 *
 * @param $url
 * @param $filename
 * @return array|false
 */
function getRemoteFileStream($url, $filename = null)
{
    $handle1 = fopen($url, "r");

    $meta_data = stream_get_meta_data($handle1);

    $stream_filename = getAttachmentNameFromStreamMeta($meta_data);

    if (!is_null($stream_filename)) {
        $filename = $stream_filename;
    }

    if (is_null($filename)) {
        return false;
    }

    $stream = stream_get_contents($handle1);

    fclose($handle1);

    return ['filename' => $filename, 'stream' => $stream];
}

/**
 * Get Filename attachment from stream meta
 *
 * @param $metadata
 * @return string|string[]|null
 */
function getAttachmentNameFromStreamMeta($metadata)
{
    if (isset($metadata['wrapper_data'])) {
        foreach ($metadata['wrapper_data'] as $meta) {
            if (Str::startsWith($meta, 'Content-Disposition') || Str::startsWith($meta, 'content-disposition')) {
                return str_replace('"', "", Str::after($meta, '='));
            }
        }
    }

    return null;
}

/**
 * Beautify Filename
 *
 * @param $filename
 * @return string
 */
function beautify_filename($filename)
{
    $filename = urldecode($filename);
    $filename = preg_replace('/[^A-Za-z0-9_.-]/', '_', $filename); // replace unsafe characters

    // reduce consecutive characters
    $filename = preg_replace([
        // "file   name.zip" becomes "file-name.zip"
        '/ +/',
        // "file___name.zip" becomes "file-name.zip"
        '/_+/',
        // "file---name.zip" becomes "file-name.zip"
        '/-+/'
    ], '_', $filename);
    $filename = preg_replace([
        // "file--.--.-.--name.zip" becomes "file.name.zip"
        '/-*\.-*/',
        // "file...name..zip" becomes "file.name.zip"
        '/\.{2,}/'
    ], '.', $filename);
    // lowercase for windows/unix interoperability http://support.microsoft.com/kb/100625
    $filename = mb_strtolower($filename, mb_detect_encoding($filename));

    // ".file-name.-" becomes "file-name"
    $filename = trim($filename, '.-');

    return $filename;
}

