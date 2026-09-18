Add-Type -AssemblyName System.Drawing

$size = 192
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Fondo oscuro elegante (#090d16)
$brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#090d16'))
$g.FillRectangle($brushBg, 0, 0, $size, $size)

# Borde sutil ámbar
$penBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'), 4)
$g.DrawEllipse($penBorder, 10, 10, 172, 172)

# Elementos gráficos de la moto
$penGold = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'), 6)
$brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'))

# Ruedas
$g.DrawEllipse($penGold, 38, 110, 36, 36)
$g.DrawEllipse($penGold, 118, 110, 36, 36)

# Cuadro
$g.DrawLine($penGold, 56, 128, 96, 95)
$g.DrawLine($penGold, 96, 95, 136, 128)
$g.DrawLine($penGold, 96, 95, 116, 65)
$g.DrawLine($penGold, 106, 65, 126, 65)

# Maletín de reparto
$brushBox = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ea580c'))
$g.FillRectangle($brushBox, 46, 70, 34, 32)
$penBox = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#fef3c7'), 2)
$g.DrawRectangle($penBox, 46, 70, 34, 32)

# Casco conductor
$g.FillEllipse($brushGold, 96, 52, 18, 18)

# Guardar iconos
$bmp.Save('public/apple-touch-icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save('public/icon-192.png', [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$g.Dispose()
Write-Host "Icons generated successfully!"
