export type InteractOutsideEvent = PointerEvent | MouseEvent | TouchEvent;

export type InteractOutsideConfig = {
	/**
	 * Callback fired when an outside interaction event completes,
	 * which is either a `pointerup`, `mouseup`, or `touchend`
	 * event, depending on the user's input device.
	 */
	onInteractOutside?: (event: InteractOutsideEvent) => void;

	/**
	 * Callback fired when an outside interaction event starts,
	 * which is either a `pointerdown`, `mousedown`, or `touchstart`
	 * event, depending on the user's input device.
	 *
	 * This callback is useful when you want to know when the user
	 * begins an outside interaction, but before the interaction
	 * completes.
	 */
	onInteractOutsideStart?: (event: InteractOutsideEvent) => void;
};
