for size in 192 512 ; do
    "C:\Program Files\Inkscape\inkscape.exe" -z -e public/logo$size.png -w $size -h $size icon.svg >/dev/null 2>/dev/null
done

"C:\Program Files\ImageMagick-7.0.10-Q16-HDRI\magick" convert icon.svg -define icon:auto-resize=16,32,48,64,128,256 -compress zip public/favicon.ico