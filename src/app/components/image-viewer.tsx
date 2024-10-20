import React, {PropsWithChildren, useEffect, useRef, useState} from "react"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import {EmblaCarouselType} from "embla-carousel";

type ImageViewerProps = {
	// This is the array of images the image carousel
	//  is currently managing.
	imageUrls: string[];
	// This is the function that is called when the
	//  user changes the active image with the
	//  image carousel.  The URL of the currently
	//  active image is passed to this function along
	//  with its height and width.
	onActiveImageChange: (imageUrl: string, dimensions: { width: number; height: number }) => void;
};

type ImageCarouselProps = {
	// This is the array of images the image carousel is currently managing.
	imageUrls: string[];
	// This is the function that is called when the
	//  user changes the active image with the
	//  image carousel.  The URL of the currently
	//  active image is passed to this function along
	//  with its height and width.
	onActiveImageChange: (imageUrl: string, dimensions: { width: number; height: number }) => void;
};

const ImageCarousel: React.FC<ImageCarouselProps> = ({ imageUrls, onActiveImageChange }) => {
	const [api, setApi] = useState<EmblaCarouselType | null>(null); // Holds the embla API instance
	const imgRef = useRef<HTMLImageElement | null>(null); // Create a ref for the image element

	// Create a handler to manage the API instance, mapping undefined to null
	const handleSetApi = (api: EmblaCarouselType | undefined) => {
		setApi(api ?? null); // If api is undefined, set it to null
	};

	// Notify parent of the active image change and pass dimensions
	const handleSelect = () => {
		// Ensure api is ready and imageUrls are available
		if (!api || imageUrls.length === 0) return;

		const selectedIndex = api?.selectedScrollSnap(); // Get the current image index

		if (onActiveImageChange && imageUrls[selectedIndex]) {
			const imageUrl = imageUrls[selectedIndex];

			// Get the image dimensions
			const width = imgRef.current?.naturalWidth ?? 0;
			const height = imgRef.current?.naturalHeight ?? 0;

			// Notify parent of active image change with dimensions
			onActiveImageChange(imageUrl, { width, height });
		}
	};

	// Listen for select events on the carousel and notify with dimensions
	useEffect(() => {
		if (!api) return;

		api?.on('select', handleSelect); // Listen for select event on carousel

		// Call the callback with the initial image when the component mounts
		handleSelect();

		return () => {
			api?.off('select', handleSelect); // Clean up the listener
		};
	}, [api, imageUrls, onActiveImageChange]);

	// Handle image load and update dimensions when an image changes or loads initially
	const handleImageLoad = () => {
		// Call handleSelect after the image has loaded to ensure dimensions are available
		handleSelect();
	};

	// Trigger image change on mount (even for single images)
	useEffect(() => {
		// Trigger handleSelect when the component mounts, even if there's only one image
		handleSelect();
	}, [imageUrls]);

	return (
		<Carousel setApi={handleSetApi} className="w-full max-w-xs">
			<CarouselContent>
				{imageUrls.map((imageUrl, index) => (
					<CarouselItem key={index}>
						<div>
							<Card className="rounded-none">
								<CardContent className="flex aspect-square items-center justify-center p-0">
									<img
										ref={imgRef} // Attach the ref to the img element
										src={imageUrl}
										alt={`Image ${index}`}
										width={500}
										height={500}
										onLoad={handleImageLoad} // Capture the image load event
									/>
								</CardContent>
							</Card>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
};
export default function ImageViewer(props: ImageViewerProps) {
	return (
		<ImageCarousel
			imageUrls={props.imageUrls}
			onActiveImageChange={props.onActiveImageChange}
		/>
	);
}
