import CONFIG from './config.js';
import { Tile } from './tile.js';
import {
	logger,
	syncMediaDirectory,
	addVfxFromPath,
	getScaledSizeToFitBox,
	ClipboardUtils,
	uploadBase64,
	addTileFromClipboard,
	debounce,
	searchFoldersByName,
} from './utilities.js';
import { VFX_TYPES } from './effects.js';
import { StageManager } from './stage-manager.js';
import { Light } from './light.js';
import { Stage } from './stage.js';

export class MindblownUI extends FormApplication {
	constructor(...args) {
		super(...args);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: CONFIG.MOD_NAME,
			title: CONFIG.MOD_NAME.toLocaleUpperCase(),
			userId: game.userId,
			popOut: false,
			template: CONFIG.TEMPLATES.MINDBLOWN,
		});
	}

	static getInstance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	static renderSingleton() {
		const instance = this.getInstance();

		// Toggle window
		if (instance._state === Application.RENDER_STATES.RENDERED) {
			instance.close();
		} else {
			instance.render(true);
			instance.getData();
			instance.activateListeners();
		}
	}

	async getData(tileType = null) {
		this[Tile.TileType.BG] = await this.getFilteredList();
		this[Tile.TileType.VFX] = await this.getFilteredList(Tile.TileType.VFX);
		this[Tile.TileType.NPC] = await this.getFilteredList(Tile.TileType.NPC);
		this[Tile.TileType.FOCUS] = await this.getFilteredList(
			Tile.TileType.FOCUS
		);
		this[Tile.TileType.LIGHT] = await this.getFilteredList(
			Tile.TileType.LIGHT
		);

		this.dockReduced =
			game.user.getFlag(CONFIG.MOD_NAME, CONFIG.DOCK_REDUCED) || true;

		this.isFavouriteMode = {
			[Tile.TileType.BG]: true,
			[Tile.TileType.NPC]: true,
			[Tile.TileType.FOCUS]: true,
			[Tile.TileType.VFX]: true,
			[Tile.TileType.LIGHT]: true,
		};

		this.layersLock = {
			[Tile.TileType.BG]: false,
			[Tile.TileType.NPC]: false,
			[Tile.TileType.FOCUS]: false,
			[Tile.TileType.VFX]: false,
			[Tile.TileType.LIGHT]: false,
		};

		this.search = {
			[Tile.TileType.BG]: '',
			[Tile.TileType.NPC]: '',
			[Tile.TileType.FOCUS]: '',
			[Tile.TileType.VFX]: '',
			[Tile.TileType.LIGHT]: '',
		};
		logger('MindblownUI getData', this);

		return this.returnUpdatedData();
	}

	returnUpdatedData() {
		return {
			[Tile.TileType.BG]: this[Tile.TileType.BG],
			[Tile.TileType.NPC]: this[Tile.TileType.NPC],
			[Tile.TileType.FOCUS]: this[Tile.TileType.FOCUS],
			[Tile.TileType.VFX]: this[Tile.TileType.VFX],
			[Tile.TileType.LIGHT]: this[Tile.TileType.LIGHT],
			layersLock: this.layersLock,
			tileType: Tile.TileType,
			dockExpanded: !this.dockReduced,
			hasStage: StageManager.shared().stage ? true : false,
			weather: {
				rain: VFX_TYPES.RAIN,
				snow: VFX_TYPES.SNOW,
				fog: VFX_TYPES.SWIRLING_FOG,
				sandstorm: VFX_TYPES.SANDSTORM,
				thunder: VFX_TYPES.THUNDER,
			},
			activeWeather: StageManager.shared().stage?.weather,
			bgModeIsFavourite: this.isFavouriteMode[Tile.TileType.BG],
			npcModeIsFavourite: this.isFavouriteMode[Tile.TileType.NPC],
			focusModeIsFavourite: this.isFavouriteMode[Tile.TileType.FOCUS],
			vfxModeIsFavourite: this.isFavouriteMode[Tile.TileType.VFX],
			lightModeIsFavourite: this.isFavouriteMode[Tile.TileType.LIGHT],
			search: this.search,
		};
	}

	isLayerLocked(tileType) {
		return this.layersLock[tileType];
	}

	toggleLayerLock(tileType) {
		Object.keys(this.layersLock).map((key) => {
			if (key === tileType) {
				this.layersLock[key] =
					StageManager.shared().toggleLayerLock(tileType);
			}
		});
	}

	async getUnfilteredList(tileType = Tile.TileType.BG) {
		return await Tile.GetTilesByType(tileType);
	}

	async getFilteredList(tileType = Tile.TileType.BG) {
		const instance = MindblownUI.getInstance();
		const list = await instance.getUnfilteredList(tileType);
		const filteredList = list.filter((item) => item.isFavourite);

		return filteredList || [];
	}

	async syncMedias(tileType = null) {
		let dir = CONFIG.BGS_DIR;
		if (tileType) {
			switch (tileType) {
				case Tile.TileType.BG:
					dir = CONFIG.BGS_DIR;
					break;
				case Tile.TileType.NPC:
					dir = CONFIG.NPCS_DIR;
					break;
				case Tile.TileType.FOCUS:
					dir = CONFIG.FOCUS_DIR;
					break;
			}
			await syncMediaDirectory(dir, tileType);
		} else {
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.BGS_DIR)) {
				await syncMediaDirectory(CONFIG.BGS_DIR, Tile.TileType.BG);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.NPCS_DIR)) {
				await syncMediaDirectory(CONFIG.NPCS_DIR, Tile.TileType.NPC);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.FOCUS_DIR)) {
				await syncMediaDirectory(CONFIG.FOCUS_DIR, Tile.TileType.FOCUS);
			}
		}
	}

	setToolbarItemsVisibility(visible) {
		const instance = MindblownUI.getInstance();
		if (instance._state !== Application.RENDER_STATES.RENDERED) return;
		const $mindblown = $('#mindblown');
		const resetBg = $mindblown.find('.toolbar.resetBg');
		const endStream = $mindblown.find('.toolbar.endStream');
		const forceStream = $mindblown.find('.toolbar.forceStream');
		const $weatherToolbar = $mindblown.find('.weatherToolbar');
		if (visible) {
			resetBg.removeClass('hidden');
			endStream.removeClass('hidden');
			forceStream.removeClass('hidden');
			$weatherToolbar
				.find('.weather-button')
				.not('.vfx')
				.removeClass('hidden');
		} else {
			resetBg.addClass('hidden');
			endStream.addClass('hidden');
			forceStream.addClass('hidden');
			$weatherToolbar
				.find('.weather-button')
				.not('.vfx')
				.addClass('hidden');
		}
	}

	openVFXDialog() {
		let inputValue = '';

		const dialog = new Dialog({
			title: 'Add VFX Tile',
			content: `
			<form>
				<div class="form-group">
					<input type="text" id="vfx-path" name="vfx-path" style="width:100%;" placeholder="Vfx Path"/>
				</div>
				<div class="form-group">
					<canvas id="vfx-thumb-canvas" width="300" height="300" style="border:1px solid #ccc;"></canvas>
				</div>
				<div class="form-group">
					<input type="range" id="vfx-time-slider" min="0" max="1" step="0.01" value="0" style="width:100%;" />
				</div>
			</form>
		  `,
			render: (html) => {
				const input = html.find('#vfx-path');
				const canvas = html.find('#vfx-thumb-canvas');
				const slider = html.find('#vfx-time-slider');
				const confirmButton = html.find(
					'button[data-button="confirm"]'
				);
				confirmButton.prop('disabled', true);
				const ctx = canvas[0].getContext('2d');

				const $video = $('<video>', {
					crossOrigin: 'anonymous',
					muted: true,
					loop: false,
					hidden: true,
					width: 300,
					height: 300,
				});
				html.append($video);

				function updateCanvas() {
					ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
					ctx.drawImage(
						$video[0],
						0,
						0,
						canvas[0].width,
						canvas[0].height
					);
				}

				$video.on('seeked', updateCanvas);

				slider.on('input', () => {
					if ($video[0].duration) {
						$video[0].currentTime =
							slider.val() * $video[0].duration;
					}
				});

				input.on('change', () => {
					const src = input.val();
					if (!src.endsWith('.webm') && !src.endsWith('.mp4')) return;
					confirmButton.prop('disabled', false);
					$video.attr('src', src);
					$video[0].load();
					$video.on('loadedmetadata', () => {
						slider.val(0);
						$video[0].currentTime = 0;
					});
				});
			},
			buttons: {
				confirm: {
					label: 'Confirm',
					icon: '<i class="fas fa-check"></i>',
					callback: async (html) => {
						const path = html.find('#vfx-path').val();
						console.log('Creating VFX Tile with path:', path);

						const canvas = html.find('#vfx-thumb-canvas')[0];

						// Grab the thumbnail as a base64 PNG
						const thumbnail = canvas.toDataURL('image/png');

						let vfx = await addVfxFromPath(path, thumbnail);
						MindblownUI.getInstance().updateList(Tile.TileType.VFX);
					},
				},
				cancel: {
					label: 'Cancel',
					icon: '<i class="fas fa-times"></i>',
					callback: () => {},
				},
			},
			default: 'confirm',
			close: (html) => {},
		});

		dialog.render(true);
		setTimeout(() => {
			Sequencer.DatabaseViewer.show();
		}, 500);
	}

	buildForm(choices, selectId = 'dropdown', nameId = 'mindblown-image-name') {
		return `
			<div class="form-group">
			<label for="${selectId}">Choose Folder</label>
			<select id="${selectId}" name="${selectId}">
				${choices
					.map(
						(folder) =>
							`<option value="${folder.id}">${folder.name}</option>`
					)
					.join('')}
			</select>
			</div>
			<div class="form-group">
			<label for="${nameId}">Image Name</label>
			<input type="text" id="${nameId}" name="${nameId}" style="width:100%;" placeholder="Image Name"/>
			</div>
		`;
	}

	openPasteFromClipboardDialog(image, choices, tileType, tiles) {
		const selectId = 'mindblown-folder-select';
		const nameId = 'mindblown-image-name';
		const htmlContent = this.buildForm(choices, selectId, nameId);

		new Dialog({
			title: 'Select Folder',
			content: `<form>${htmlContent}</form>`,
			buttons: {
				ok: {
					label: 'Confirm',
					callback: async (html) => {
						const folderId = html.find(`#${selectId}`).val();
						const name = html.find(`#${nameId}`).val();
						ui.notifications.info(
							`Creating tile from clipboard inside ${folderId} folder`
						);
						logger('image', image);
						// Handle selection
						if (name.length === 0) {
							ui.notifications.error(
								'Please provide a name for the image.'
							);
							return;
						}
						let localPath = '';
						switch (tileType) {
							case Tile.TileType.NPC:
								localPath = await game.settings.get(
									CONFIG.MOD_NAME,
									CONFIG.NPCS_DIR
								);
								break;
							case Tile.TileType.FOCUS:
								localPath = await game.settings.get(
									CONFIG.MOD_NAME,
									CONFIG.FOCUS_DIR
								);
								break;
							case Tile.TileType.BG:
							default:
								localPath = await game.settings.get(
									CONFIG.MOD_NAME,
									CONFIG.BGS_DIR
								);
								break;
						}
						const folder = await Tile.FindFolderById(
							tileType,
							folderId,
							tiles
						);
						const tilePath = localPath.split('/').pop();
						const folderPath = tilePath + '/' + folder.name;
						try {
							let result = await uploadBase64(
								image,
								folderPath,
								name + '.webp',
								tileType
							);
							if (result.status === 'success' && result.path) {
								ui.notifications.info(
									result.message ||
										'Image uploaded successfully.'
								);

								let tile = await addTileFromClipboard(
									result.path,
									folder,
									name,
									tileType,
									tiles
								);

								folder.tiles.push(tile);
								await Tile.UpdateFolder(folder, tileType);
								this.updateList(tileType);
							} else {
								ui.notifications.error(
									`Failed to upload image: ${
										result.error || 'Unknown error'
									}`
								);
								return;
							}
						} catch (error) {
							ui.notifications.error(
								`Failed to upload image: ${
									error.message || 'Unknown error'
								}`
							);
						}
					},
				},
				cancel: {
					label: 'Cancel',
				},
			},
			default: 'ok',
		}).render(true);
	}

	async toggleStageVisibility(hidden) {
		const $mbCanvas = $(`#${CONFIG.MB_CANVAS_ID}`);
		if (!$mbCanvas.length) return;
		if (!hidden) {
			$mbCanvas.removeClass('hidden');
		} else {
			$mbCanvas.addClass('hidden');
		}
	}

	// HANDLE GENERIC UPDATE LIST
	async updateList(tileType, filteredBySearch = null) {
		let template = CONFIG.TEMPLATES.PANEL;
		let $wrapper = $('#bgsWrapper');
		let scroll = 0;
		const instance = MindblownUI.getInstance();

		switch (tileType) {
			case Tile.TileType.NPC:
				$wrapper = $('#npcsWrapper');
				break;
			case Tile.TileType.FOCUS:
				$wrapper = $('#focusWrapper');
				break;
			case Tile.TileType.VFX:
				$wrapper = $('#vfxWrapper');
				break;
			case Tile.TileType.LIGHT:
				$wrapper = $('#lightWrapper');
				break;
			case Tile.TileType.BG:
				template = CONFIG.TEMPLATES.BGS;
				break;
		}

		if (!filteredBySearch) {
			if (
				instance.search[tileType] &&
				instance.search[tileType].length > 0
			) {
				filteredBySearch = instance[tileType];
			}
		}

		if (!filteredBySearch) {
			if (tileType !== Tile.TileType.BG) {
				scroll = $wrapper.find('.mindblown-panel-content').scrollTop();
			} else {
				scroll = $wrapper.find('.accordion-container').css('transform');
			}

			instance[tileType] = instance.isFavouriteMode[tileType]
				? (await instance.getFilteredList(tileType)) || {}
				: (await instance.getUnfilteredList(tileType)) || {};
		} else {
			instance[tileType] = filteredBySearch || [];
		}

		const data = MindblownUI.getInstance().returnUpdatedData();
		const html = await renderTemplate(template, {
			...data,
			panelType: tileType,
			panelClosed: false,
		});
		$wrapper.html(html);
		if (!filteredBySearch) {
			if (tileType !== Tile.TileType.BG) {
				$wrapper.find('.mindblown-panel-content').scrollTop(scroll);
			} else {
				$wrapper.find('.accordion-container').css('transform', scroll);
			}

			instance.addBgsDragAndDropListeners();
			instance.addPanelsDragAndDropListeners();
		}
	}

	addBgsDragAndDropListeners() {
		const bgsAccordion = document.getElementById('bgsAccordion');
		const bgsDataAccordions = document.querySelectorAll('.accordion-data');

		Sortable.create(bgsAccordion, {
			group: 'bgsAccordion',
			sort: true,
			direction: 'horizontal',
			draggable: '.draggable-item',
			handle: '.mindblown-category',
			animation: 150,
			onEnd: (evt) => {
				logger('Drag ended', evt);
				const instance = MindblownUI.getInstance();
				instance.onFolderDragEnd(evt);
			},
		});

		bgsDataAccordions.forEach((accordion) => {
			Sortable.create(accordion, {
				group: accordion.id,
				sort: true,
				direction: 'horizontal',
				draggable: '.accordion-data-item',
				animation: 150,
				onEnd: (evt) => {
					logger('Data drag ended', evt);
					const instance = MindblownUI.getInstance();
					instance.onTileDragEnd(evt);
				},
			});
		});
	}

	addPanelsDragAndDropListeners() {
		const panelAccordions = document.querySelectorAll(
			'.mindblown-accordion'
		);
		const panelGridAccordions =
			document.querySelectorAll('.mindblown-grid');

		panelAccordions.forEach((accordion) => {
			Sortable.create(accordion, {
				group: accordion.id,
				sort: true,
				direction: 'vertical',
				draggable: '.mindblown-accordion-item',
				animation: 150,
				handle: '.mindblown-accordion-head',
				onEnd: (evt) => {
					logger('Panel drag ended', evt);
					const instance = MindblownUI.getInstance();
					instance.onFolderDragEnd(evt);
				},
			});
		});
		panelGridAccordions.forEach((accordion) => {
			Sortable.create(accordion, {
				group: accordion.id,
				sort: true,
				draggable: '.mindblown-grid-item',
				animation: 150,
				onEnd: (evt) => {
					logger('Data drag ended', evt);
					const instance = MindblownUI.getInstance();
					instance.onTileDragEnd(evt);
				},
			});
		});
	}

	async onTileDragEnd(evt) {
		const tileType = evt.item.dataset.tiletype;
		let folderIndex = evt.item.dataset.folderindex;
		if (!tileType || !folderIndex) return;
		let draggedIndex = evt.oldIndex;
		let targetIndex = evt.newIndex;

		let draggedTile = this[tileType][folderIndex].tiles[draggedIndex];
		let targetTile = this[tileType][folderIndex].tiles[targetIndex];
		let targetFolder = this[tileType][folderIndex];
		let fullList = await this.getUnfilteredList(tileType);
		if (this.isFavouriteMode[tileType]) {
			folderIndex = fullList.findIndex(
				(folder) => folder.id === targetFolder.id
			);
		}
		if (
			draggedIndex === -1 ||
			targetIndex === -1 ||
			folderIndex === -1 ||
			!draggedTile
		) {
			return;
		}
		fullList[folderIndex].tiles.splice(draggedIndex, 1);
		fullList[folderIndex].tiles.splice(targetIndex, 0, draggedTile);
		await Tile.UpdateTilesByType(tileType, fullList);
		this.updateList(tileType);
	}

	async onFolderDragEnd(evt) {
		const tileType = evt.item.dataset.tiletype;

		if (!tileType) return;

		let draggedIndex = evt.oldIndex;
		let targetIndex = evt.newIndex;
		let draggedFolder = this[tileType][draggedIndex];
		let targetFolder = this[tileType][targetIndex];
		let fullList = await this.getUnfilteredList(tileType);
		if (this.isFavouriteMode[tileType]) {
			draggedIndex = fullList.findIndex(
				(folder) => folder.id === draggedFolder.id
			);
			targetIndex = fullList.findIndex(
				(folder) => folder.id === targetFolder.id
			);
		}
		if (draggedIndex === -1 || targetIndex === -1 || !draggedFolder) return;
		fullList.splice(draggedIndex, 1);
		fullList.splice(targetIndex, 0, draggedFolder);
		await Tile.UpdateTilesByType(tileType, fullList);
		this.updateList(tileType);
	}

	async activateListeners() {
		const $mindblown = $('#mindblown');
		const instance = MindblownUI.getInstance();

		let currentX = 0;
		$mindblown.on('wheel', '#bgsWrapper', (e) => {
			e.preventDefault();
			const $target = $('#bgsWrapper');
			const scrollableEl = $target.find('.accordion-container')[0];
			// Use deltaY or deltaX depending on mouse wheel direction
			const delta = e.originalEvent.deltaY || e.originalEvent.deltaX || 0;

			const maxScroll = scrollableEl.scrollWidth - $target.outerWidth();

			currentX = Math.min(Math.max(currentX - delta, -maxScroll), 0);

			$(scrollableEl).css(
				'transform',
				`translate3d(${currentX}px, 0, 0)`
			);
		});

		$mindblown.on(
			'input',
			'.mindblown-search',
			debounce(async (event) => {
				const instance = MindblownUI.getInstance();
				const $target = $(event.currentTarget);
				const tileType = $target.data('tiletype');
				instance.search[tileType] = event.target.value;
				if (
					instance.search[tileType].length > 3 ||
					instance.search[tileType].length === 0
				) {
					const filtered = searchFoldersByName(
						instance[tileType],
						instance.search[tileType]
					);
					await this.updateList(
						tileType,
						instance.search[tileType].length > 0 ? filtered : null
					);
					setTimeout(() => {
						let $newTarget = $(
							'.bgs-search-wrapper .mindblown-search'
						);
						switch (tileType) {
							case Tile.TileType.NPC:
								$newTarget = $(
									'.NPC-search-wrapper .mindblown-search'
								);
								break;
							case Tile.TileType.FOCUS:
								$newTarget = $(
									'.FOCUS-search-wrapper .mindblown-search'
								);
								break;
							case Tile.TileType.VFX:
								$newTarget = $(
									'.VFX-search-wrapper .mindblown-search'
								);
								break;
							case Tile.TileType.LIGHT:
								$newTarget = $(
									'.LIGHT-search-wrapper .mindblown-search'
								);
								break;
						}
						$newTarget.focus();
						$newTarget[0].setSelectionRange(
							$newTarget.val().length,
							$newTarget.val().length
						);
					}, 0);
				}
			}, 250)
		);

		function showMediaPreview(event, isAPanel = false) {
			const $target = $(event.target);
			const type = $target.data('mediatype');
			const src = $target.data('src');
			const name = $target.data('name');

			let content = '';
			if (type === Tile.MediaType.IMAGE) {
				content = `<img src="${src}" class="media-content" alt="preview" style="width:100%; height: auto;">`;
			} else if (type === Tile.MediaType.VIDEO) {
				content = `<video src="${src}" autoplay muted loop class="media-content" style="width:100%; height: auto;"></video>`;
			}
			if(name){
				content += `<div class="media-name">${name}</div>`;
			}
			if (content && content.length > 0) {
				let $tooltip = $target.find('.media-tooltip');
				if (isAPanel) {
					$tooltip = $target
						.closest('.mindblown-panel-container')
						.find('.media-tooltip');
				}
				$tooltip.addClass('active').html(content);
			}
		}

		function hideMediaPreview(event, isAPanel = false) {
			const $target = $(event.target);
			let $tooltip = $target.find('.media-tooltip');
			if (isAPanel) {
				$tooltip = $target
					.closest('.mindblown-panel-container')
					.find('.media-tooltip');
			}
			$tooltip.html('').removeClass('active');
			if (!isAPanel) {
				$tooltip.css({ left: 'auto' });
			}
		}

		$mindblown.on(
			'mouseenter',
			'.accordion-container .media-item',
			showMediaPreview
		);

		$mindblown.on(
			'mouseenter',
			'.mindblown-accordion .media-item',
			function (event) {
				showMediaPreview(event, true);
			}
		);

		$mindblown.on(
			'mousemove',
			'.accordion-container .media-item',
			function (event) {
				const $target = $(event.target);
				const $closestContainer = $target.closest(
					'.accordion-container'
				);
				let $tooltip = $target.find('.media-tooltip');

				if ($tooltip) {
					let left = 0;
					logger(
						`offset ${
							$target.offset().left
						} - tooltip ${$tooltip.outerWidth()}`
					);
					if (
						$target.offset().left + 100 + $tooltip.outerWidth() >
						window.innerWidth
					) {
						left = 80 - $tooltip.outerWidth();
					}

					$tooltip.css({ left: left });
				}
			}
		);

		$mindblown.on(
			'mouseleave',
			'.accordion-container .media-item',
			hideMediaPreview
		);

		$mindblown.on(
			'mouseleave',
			'.mindblown-accordion .media-item',
			function (event) {
				hideMediaPreview(event, true);
			}
		);

		function pasteFromClipboard(event) {
			const instance = MindblownUI.getInstance();
			const $target = $(event.currentTarget);
			const tileType = $target.attr('data-tiletype');

			ClipboardUtils.readImage(async function (data, error) {
				if (error) {
					console.log(error);
					return;
				}
				if (data) {
					let tiles = await instance.getUnfilteredList(tileType);
					instance.openPasteFromClipboardDialog(
						data,
						tiles,
						tileType,
						tiles
					);
					return;
				}

				ui.notifications.error(
					'Image is not available - copy image to clipboard.'
				);
				return;
			});
		}

		// HANDLE GENERIC TOOLBAR CLICK (TOGGLE REDUCE )
		$mindblown.on('click', '.toolbar', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const $target = $(event.currentTarget);

			if ($target.hasClass('toggleReduce')) {
				const $bgsAccordion = $target.closest(
					'.horizontal-accordion-one.mindblown-bgs'
				);

				$bgsAccordion.toggleClass('reduced');
				const $wrappers = $mindblown.find(
					'.mindblown-accordion-wrapper'
				);

				const $weatherToolbar = $mindblown.find('.weatherToolbar');
				const $bgsContainer = $bgsAccordion.find(
					'.accordion-container'
				);
				$wrappers.toggleClass('reduced');
				$weatherToolbar.toggleClass('reduced');
				let html = '';

				const isReduced = $bgsAccordion.hasClass('reduced');
				MindblownUI.getInstance().dockReduced = isReduced;
				if (!isReduced) {
					MindblownUI.getInstance().updateList(Tile.TileType.BG);
					html =
						'<span class="title">MINIMIZE</span>  <i class="fa-solid fa-compress"></i>';
				} else {
					$bgsContainer.empty();
					html =
						'<span class="title">EXPAND</span>  <i class="fa-solid fa-expand"></i>';
				}
				$target.html(html);
				game.user.setFlag(
					CONFIG.MOD_NAME,
					CONFIG.DOCK_REDUCED,
					$bgsAccordion.hasClass('reduced')
				);
			} else if ($target.hasClass('savePreset')) {
				StageManager.shared().saveStagePreset();
				const instance = MindblownUI.getInstance();
				instance.updateList(Tile.TileType.BG);
			} else if ($target.hasClass('pastePanel')) {
				const instance = MindblownUI.getInstance();
				pasteFromClipboard(event);
			}
		});

		// HANDLE GENERIC OPENING/CLOSING PANEL
		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-panel-toggle .toggle-panel',
			function () {
				const instance = MindblownUI.getInstance();
				const panelContainer = $(this).closest(
					'.mindblown-panel-container'
				);
				panelContainer.toggleClass('closed open');
				if (panelContainer.hasClass('open')) {
					instance.addPanelsDragAndDropListeners();
				}
			}
		);
		// HANDLE OPEN VFX DATABASE AND DIALOG
		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-panel-toggle #openVFXManager',
			function () {
				const instance = MindblownUI.getInstance();
				instance.openVFXDialog();
			}
		);

		// HANDLE LAYER LOCKING/UNLOCKING INTERACTIVITY
		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-panel-toggle .toggle-layer-lock',
			function (event) {
				const instance = MindblownUI.getInstance();
				const $target = $(event.currentTarget);
				const tileType = $target.attr('data-tiletype');
				instance.toggleLayerLock(tileType);

				if ($target.hasClass('fa-lock')) {
					$target.removeClass('fa-lock').addClass('fa-lock-open');
				} else {
					$target.removeClass('fa-lock-open').addClass('fa-lock');
				}
			}
		);

		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-panel-toggle .paste-panel',
			pasteFromClipboard
		);

		// HANDLE PANEL ITEM CLICK
		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-grid-item',
			function (event) {
				showOnStage(event);
			}
		);

		// HANDLE WEATHER BUTTON CLICK
		$mindblown.on('click', '.weather-button', function (event) {
			event.preventDefault();
			const $target = $(event.currentTarget);
			const effect = $target.attr('data-effect');
			if (effect === VFX_TYPES.THUNDER) {
				StageManager.shared().setFilterEffect(effect);
				return;
			}
			if ($target.hasClass('active')) {
				$target.removeClass('active');
				StageManager.shared().setWeather(null);
			} else {
				$target.addClass('active');
				StageManager.shared().setWeather(effect);
			}
		});

		// HANDLE PANEL ACCORDION CLICK
		$mindblown.on(
			'click',
			'.mindblown-panel-container .mindblown-accordion-head .mindblown-accordion-title',
			async function (event) {
				const head = $(event.currentTarget);
				const item = head.closest('.mindblown-accordion-item');
				const tileType = item.attr('data-tiletype');
				const folderName = item.attr('data-folder');
				const folderIndex = item.attr('data-folderindex');

				if (item.hasClass('open')) {
					// Close
					item.removeClass('open');
					item.find('.mindblown-accordion-body').remove();
					instance[tileType][folderIndex].isActive = false;
				} else {
					// Open current
					item.addClass('open');

					instance[tileType][folderIndex].isActive = true;
				}
				await Tile.UpdateFolder(
					instance[tileType][folderIndex],
					tileType
				);
				MindblownUI.getInstance().updateList(tileType);
			}
		);

		// HANDLE GENERIC SET FAVOURITE CLICK
		$mindblown.on('click', '.setIsFavourite', async (event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			if (!event || !event.currentTarget) return;
			const instance = MindblownUI.getInstance();
			const $target = $(event.currentTarget);
			const $wrapper = $target.closest('.mindblown-accordion-wrapper');
			const $tileItem = $target.closest('.accordion-item');
			const folderName = $tileItem.attr('data-folder');
			const folderIndex = $tileItem.attr('data-folderindex');
			const tileType = $tileItem.attr('data-tiletype');

			let favKey = CONFIG.FAV_CATEGORIES.BG;
			let favListKey = 'favouriteBGs';

			let folder = MindblownUI.getInstance()[tileType][folderIndex];

			if (!folder?.isFavourite) {
				$target.addClass('active');
				folder.isFavourite = true;
			} else {
				$target.removeClass('active');
				folder.isFavourite = false;
			}

			Tile.UpdateFolder(folder, tileType);
			MindblownUI.getInstance().updateList(tileType);
		});

		// HANDLE GENERIC FILTER FAVOURITES
		$mindblown.on('click', '.filterFavourites', async (event) => {
			const instance = MindblownUI.getInstance();

			const $target = $(event.currentTarget);
			const tileType = $target.attr('data-tiletype');
			instance.isFavouriteMode[tileType] =
				!instance.isFavouriteMode[tileType];

			$target.toggleClass('active');
			MindblownUI.getInstance().updateList(tileType);
		});

		// HANDLE BGS CATEGORY CLICK
		$mindblown.on(
			'click',
			'.accordion-container .head-title',
			async (event) => {
				if (!event || !event.currentTarget) return;
				const instance = MindblownUI.getInstance();
				const $target = $(event.currentTarget).closest(
					'li.accordion-item'
				);
				const folderName = $target.attr('data-folder');
				const folderIndex = $target.attr('data-folderindex');
				const tileType = $target.attr('data-tiletype');
				const folder = MindblownUI.getInstance()[tileType][folderIndex];

				const alreadyActive =
					$target.hasClass('active') && folder.isActive;

				if (!alreadyActive) {
					$target.addClass('active');
					folder.isActive = true;
				} else {
					folder.isActive = false;
					$target.removeClass('active');
					let accData = $target.find('.accordion-data');
					logger('accData', accData);
					if (accData.length) {
						for (const element of accData) {
							element.remove();
						}
					}
				}
				await Tile.UpdateFolder(folder, tileType);
				MindblownUI.getInstance().updateList(tileType);
			}
		);

		// HANDLE BGS ITEM CLICK
		$mindblown.on(
			'click',
			'.accordion-container .accordion-data-item',
			async (event) => {
				showOnStage(event);
			}
		);

		// HANDLE BGS ITEM CLICK
		$mindblown.on(
			'click',
			'.accordion-container .accordion-data-item .accordion-data-item-presets-icon',
			async (event) => {
				event.preventDefault();
				event.stopImmediatePropagation();

				const instance = MindblownUI.getInstance();
				let $target = $(event.currentTarget);
				const preset = $target.hasClass('lights-preset')
					? 'lightsPreset'
					: $target.hasClass('vfx-preset')
					? 'vfxPreset'
					: null;

				let $item = $target.closest('.accordion-data-item');
				const folder = $item.attr('data-folder');
				const index = $item.attr('data-index');
				const folderIndex = $item.attr('data-folderindex');
				const tileType = $item.attr('data-tiletype');
				const tileId = $item.attr('data-tileId');

				const actualTile = await Tile.GetTileById(
					tileType,
					tileId,
					instance.bgs
				);

				if (actualTile) {
					if ($target.hasClass('off')) {
						const tileFromDb = await Tile.GetTileById(
							tileType,
							tileId
						);
						actualTile[preset] = tileFromDb[preset] || null;
						$target.removeClass('off');
					} else {
						actualTile[preset] = null;
						$target.addClass('off');
					}
				}
			}
		);

		// HANDLE GENERIC ITEM CLICK
		async function showOnStage(event) {
			const $target = $(event.currentTarget);
			const tileId = $target.attr('data-tileId');
			const folderIndex = $target.attr('data-folderindex');
			const folderName = $target.attr('data-folder');
			const index = $target.attr('data-index');
			const tileType = $target.attr('data-tiletype');
			const instance = MindblownUI.getInstance();
			let tile = null;
			tile = instance[tileType][folderIndex].tiles[index];
			switch (tileType) {
				case Tile.TileType.BG:
					StageManager.shared().setBg(tile);
					break;
				case Tile.TileType.NPC:
					StageManager.shared().setNpc(tile);
					break;
				case Tile.TileType.FOCUS:
					StageManager.shared().setFocus(tile);
					break;
				case Tile.TileType.VFX:
					StageManager.shared().setVfx(tile);
					break;
				case Tile.TileType.LIGHT:
					const light = instance.LIGHT[folderIndex].tiles[index];
					tile = new Tile(
						light.name,
						null,
						tileType,
						true,
						true,
						folderName
					);
					tile.pixiOptions = structuredClone(
						Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
					);
					tile.pixiOptionsRuntime = structuredClone(
						Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
					);
					tile.pixiOptions.type = light.name;
					tile.pixiOptionsRuntime.type = light.name;
					tile.id += '_' + new Date().getTime();
					StageManager.shared().addLight(tile, true);
					break;
			}
		}
	}
}
