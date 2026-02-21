import * as React from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100", className)}
        {...props}
    />
))
Avatar.displayName = "Avatar"

type AvatarImageProps = Omit<ImageProps, "fill" | "alt"> & {
    alt?: string
    sizes?: string
}

function AvatarImage({ className, alt = "", sizes = "40px", ...props }: AvatarImageProps) {
    return (
        <Image
            fill
            sizes={sizes}
            className={cn("aspect-square h-full w-full object-cover", className)}
            alt={alt}
            {...props}
        />
    )
}

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600", className)}
        {...props}
    />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
