/** @format */
'use client';

type LoaderProps = {
	size?: number; // px
	text?: string;
	className?: string;
};

export default function Loader({ size = 96, text, className = '' }: LoaderProps) {
	return (
		<div className={`flex flex-col items-center justify-center w-full h-full ${className}`}>
			<img src='/icons/loader.svg' alt='' style={{ width: size, height: size }} className='opacity-80' />

			{text && <div className='mt-4 text-sm tracking-wide'>{text}</div>}
		</div>
	);
}
