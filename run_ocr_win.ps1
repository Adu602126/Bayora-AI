Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

function Await-Op($asyncOp) {
    $asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Length -eq 1
    } | Select-Object -First 1
    $targetType = $asyncOp.GetType().GetInterfaces() | Where-Object { $_.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
    $argType = $targetType.GetGenericArguments()[0]
    $specMethod = $asTaskMethod.MakeGenericMethod($argType)
    $task = $specMethod.Invoke($null, @($asyncOp))
    $task.Wait()
    return $task.Result
}

$images = @('image4.png', 'image6.png', 'image7.png', 'image8.png', 'image9.png', 'image10.png', 'image11.png', 'image12.png')

foreach ($img in $images) {
    $p = (Resolve-Path "d:\safepath\ppt_images\ppt\media\$img").Path
    try {
        $file = Await-Op ([Windows.Storage.StorageFile]::GetFileFromPathAsync($p))
        $stream = Await-Op ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read))
        $decoder = Await-Op ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
        $bitmap = Await-Op ($decoder.GetSoftwareBitmapAsync())
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
        $ocrResult = Await-Op ($engine.RecognizeAsync($bitmap))
        Write-Host "=== $img ==="
        Write-Host $ocrResult.Text
    } catch {
        Write-Host "=== $img ERROR ==="
        Write-Host $_.Exception.Message
    }
}
