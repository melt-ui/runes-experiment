import {
	type FocusProp,
	type HTMLElementEvent,
	type PortalTarget,
	type ReadableBox,
	type WritableBox,
	autoDestroyEffectRoot,
	element,
	generateId,
	getPortalDestination,
	handleFocus,
	kbd,
	portalAttr,
	readableBox,
	removeScroll,
	runAfterTransitionOutOrImmediate,
	styleToString,
	useEscapeKeydown,
	useFocusTrap,
	useModal,
	usePortal,
	writableBox,
} from "@melt-ui/helpers";
import type { DialogProps, DialogRole } from "./types.js";

const elements = {
	TRIGGER: "dialog-trigger",
	OVERLAY: "dialog-overlay",
	CONTENT: "dialog-content",
	PORTALLED: "dialog-portalled",
	TITLE: "dialog-title",
	DESCRIPTION: "dialog-description",
	CLOSE: "dialog-close",
} as const;

export class Dialog {
	#openBox: WritableBox<boolean>;
	#preventScrollBox: ReadableBox<boolean>;
	#closeOnEscapeBox: ReadableBox<boolean>;
	#closeOnOutsideClickBox: ReadableBox<boolean>;
	#onOutsideClick?: (event: PointerEvent) => void;
	#roleBox: ReadableBox<DialogRole>;
	#portalBox: ReadableBox<PortalTarget>;
	#openFocusBox: ReadableBox<FocusProp>;
	#closeFocusBox: ReadableBox<FocusProp>;
	#overlayIdBox: ReadableBox<string>;
	#contentIdBox: ReadableBox<string>;
	#portalledIdBox: ReadableBox<string>;
	#titleIdBox: ReadableBox<string>;
	#descriptionIdBox: ReadableBox<string>;

	constructor(props: DialogProps = {}) {
		const {
			open = false,
			preventScroll = true,
			closeOnEscape = true,
			closeOnOutsideClick = true,
			onOutsideClick,
			role = "dialog",
			portal,
			openFocus,
			closeFocus,
			overlayId = generateId(),
			contentId = generateId(),
			portalledId = generateId(),
			titleId = generateId(),
			descriptionId = generateId(),
		} = props;

		this.#openBox = writableBox(open);
		this.#preventScrollBox = readableBox(preventScroll);
		this.#closeOnEscapeBox = readableBox(closeOnEscape);
		this.#closeOnOutsideClickBox = readableBox(closeOnOutsideClick);
		this.#onOutsideClick = onOutsideClick;
		this.#roleBox = readableBox(role);
		this.#portalBox = readableBox(portal);
		this.#openFocusBox = readableBox(openFocus);
		this.#closeFocusBox = readableBox(closeFocus);
		this.#overlayIdBox = readableBox(overlayId);
		this.#contentIdBox = readableBox(contentId);
		this.#portalledIdBox = readableBox(portalledId);
		this.#titleIdBox = readableBox(titleId);
		this.#descriptionIdBox = readableBox(descriptionId);
	}

	#activeTrigger: HTMLElement | null = null;

	get open() {
		return this.#openBox.value;
	}

	set open(value: boolean) {
		this.#openBox.value = value;
	}

	get preventScroll() {
		return this.#preventScrollBox.value;
	}

	get closeOnEscape() {
		return this.#closeOnEscapeBox.value;
	}

	get closeOnOutsideClick() {
		return this.#closeOnOutsideClickBox.value;
	}

	get role() {
		return this.#roleBox.value;
	}

	get portal() {
		return this.#portalBox.value;
	}

	get openFocus() {
		return this.#openFocusBox.value;
	}

	get closeFocus() {
		return this.#closeFocusBox.value;
	}

	get overlayId() {
		return this.#overlayIdBox.value;
	}

	get contentId() {
		return this.#contentIdBox.value;
	}

	get portalledId() {
		return this.#portalledIdBox.value;
	}

	get titleId() {
		return this.#titleIdBox.value;
	}

	get descriptionId() {
		return this.#descriptionIdBox.value;
	}

	// Helpers
	#open(event: HTMLElementEvent) {
		this.open = true;
		this.#activeTrigger = event.currentTarget;
	}

	#close() {
		this.open = false;
		handleFocus({
			prop: this.closeFocus,
			defaultEl: this.#activeTrigger,
		});
	}

	// Elements
	trigger() {
		const dialog = this;
		return element(elements.TRIGGER, {
			"aria-haspopup": "dialog",
			"type": "button",
			get "aria-expanded"() {
				return dialog.open;
			},
			"onclick": dialog.#open.bind(dialog),
			onkeydown(event) {
				if (event.key !== kbd.ENTER && event.key !== kbd.SPACE) {
					return;
				}
				event.preventDefault();
				dialog.#open(event);
			},
		});
	}

	overlay() {
		const dialog = this;
		return element(elements.OVERLAY, {
			"aria-hidden": true,
			"tabindex": -1,
			get "id"() {
				return dialog.overlayId;
			},
			get "style"() {
				return styleToString({
					display: !dialog.open ? "none" : undefined,
				});
			},
			get "data-state"() {
				return dialog.open ? "open" : "closed";
			},
		});
	}

	content() {
		const dialog = this;
		return element(elements.CONTENT, {
			"aria-modal": "true",
			"tabindex": -1,
			get "id"() {
				return dialog.contentId;
			},
			get "role"() {
				return dialog.role;
			},
			get "aria-describedby"() {
				return dialog.descriptionId;
			},
			get "aria-labelledby"() {
				return dialog.titleId;
			},
			get "aria-hidden"() {
				return !dialog.open;
			},
			get "style"() {
				return styleToString({
					display: !dialog.open ? "none" : undefined,
				});
			},
			get "data-state"() {
				return dialog.open ? "open" : "closed";
			},
		});
	}

	portalled() {
		const dialog = this;
		return element(elements.PORTALLED, {
			get "id"() {
				return dialog.portalledId;
			},
			get "data-portal"() {
				return portalAttr(dialog.portal);
			},
		});
	}

	title() {
		const dialog = this;
		return element(elements.TITLE, {
			get id() {
				return dialog.titleId;
			},
		});
	}

	description() {
		const dialog = this;
		return element(elements.DESCRIPTION, {
			get id() {
				return dialog.descriptionId;
			},
		});
	}

	closeButton() {
		const dialog = this;
		return element(elements.CLOSE, {
			type: "button",
			onclick: dialog.#close.bind(dialog),
			onkeydown(event) {
				if (event.key !== kbd.ENTER && event.key !== kbd.SPACE) {
					return;
				}
				event.preventDefault();
				dialog.#close();
			},
		});
	}

	// Effects
	readonly destroy = autoDestroyEffectRoot(() => {
		$effect(() => {
			if (!this.closeOnEscape || !this.open) {
				return;
			}

			const overlayEl = document.getElementById(this.overlayId);
			if (overlayEl === null) {
				return;
			}

			useEscapeKeydown(overlayEl, {
				handler: this.#close.bind(this),
			});
		});

		$effect(() => {
			if (!this.closeOnEscape || !this.open) {
				return;
			}

			const contentEl = document.getElementById(this.contentId);
			if (contentEl === null) {
				return;
			}

			useEscapeKeydown(contentEl, {
				handler: this.#close.bind(this),
			});
		});

		$effect(() => {
			if (!this.open) {
				return;
			}

			const contentEl = document.getElementById(this.contentId);
			if (contentEl === null) {
				return;
			}

			useModal(contentEl, {
				closeOnInteractOutside: this.closeOnOutsideClick,
				onClose: this.#close.bind(this),
				shouldCloseOnInteractOutside: (event) => {
					this.#onOutsideClick?.(event);
					return !event.defaultPrevented;
				},
			});
		});

		$effect(() => {
			if (!this.open) {
				return;
			}

			const contentEl = document.getElementById(this.contentId);
			if (contentEl === null) {
				return;
			}

			useFocusTrap(contentEl, {
				escapeDeactivates: true,
				clickOutsideDeactivates: true,
				returnFocusOnDeactivate: false,
				fallbackFocus: contentEl,
			});
		});

		$effect(() => {
			if (!this.open) {
				return;
			}

			const contentEl = document.getElementById(this.contentId);
			if (contentEl === null) {
				return;
			}

			handleFocus({
				prop: this.openFocus,
				defaultEl: contentEl,
			});
		});

		$effect(() => {
			if (!this.preventScroll || !this.open) {
				return;
			}

			const contentEl = document.getElementById(this.contentId);
			if (contentEl === null) {
				return;
			}

			const cleanupScroll = removeScroll();
			return () => {
				runAfterTransitionOutOrImmediate(contentEl, cleanupScroll);
			};
		});

		$effect(() => {
			if (this.portal === null) {
				return;
			}

			const portalledEl = document.getElementById(this.portalledId);
			if (portalledEl === null) {
				return;
			}

			const portalDestination = getPortalDestination(portalledEl, this.portal);
			const { destroy } = usePortal(portalledEl, portalDestination);
			return destroy;
		});
	});
}
