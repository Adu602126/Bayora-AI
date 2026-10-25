Add-Type -AssemblyName System.Drawing
[Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

function Run-Ocr([string]$filePath) {
    $fullPath = [System.IO.Path]::GetFullPath($filePath)
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($fullPath)
    $file = $fileOp.GetAwaiter().GetResult()
    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = $streamOp.GetAwaiter().GetResult()
    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = $decoderOp.GetAwaiter().GetResult()
    $bitmapOp = $decoder.GetSoftwareBitmapAsync()
    $bitmap = $bitmapOp.GetAwaiter().GetResult()
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
    $resultOp = $engine.RecognizeAsync($bitmap)
    $result = $resultOp.GetAwaiter().GetResult()
    return $result.Text
}

$images = @('image4.png', 'image6.png', 'image7.png', 'image8.png', 'image9.png', 'image10.png', 'image11.png', 'image12.png')

foreach ($img in $images) {
    $p = "d:\safepath\ppt_images\ppt\media\$img"
    if (Test-Path $p) {
        Write-Host "=========================================="
        Write-Host "FILE: $img"
        Write-Host "=========================================="
        try {
            $txt = Run-Ocr $p
            Write-Host $txt
        } catch {
            Write-Host "OCR Error: $_"
        }
    }
}
