Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Administrator\.gemini\antigravity\brain\4a12c233-90a8-42dd-b215-46929c478897\.user_uploaded\media_1789779234721.jpg"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found at $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)
Write-Host "Original dimensions: $($srcImg.Width)x$($srcImg.Height)"

function Resize-And-Save($targetWidth, $targetHeight, $outputPath, $format) {
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight)

    $parentDir = Split-Path -Parent $outputPath
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $bmp.Save($outputPath, $format)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($($targetWidth)x$($targetHeight))"
}

# 1. High-Res Avatar & Icons
Resize-And-Save 512 512 "public/avatar.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-And-Save 512 512 "public/icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-And-Save 512 512 "public/icon-512.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 2. PWA & Mobile Icons
Resize-And-Save 192 192 "public/icon-192.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-And-Save 180 180 "public/apple-touch-icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 3. Next.js App Router icons
Resize-And-Save 512 512 "src/app/icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-And-Save 180 180 "src/app/apple-icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 4. Favicon 48x48 and 32x32
Resize-And-Save 48 48 "public/favicon.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-And-Save 48 48 "public/favicon.ico" ([System.Drawing.Imaging.ImageFormat]::Icon)
Resize-And-Save 48 48 "src/app/favicon.ico" ([System.Drawing.Imaging.ImageFormat]::Icon)

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
