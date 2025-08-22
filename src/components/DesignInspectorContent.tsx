import React from 'react';
import { Trash2, Plus, Search, Palette, Monitor, Smartphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import SmartInput from './SmartInput';
import ColorSwatch from './ColorSwatch';

const PanelRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
	<label style={{ display: 'grid', gap: 4 }}>
		<span style={{ fontSize: 11, color: '#facc15', letterSpacing: 0.2 as any }}>{label}</span>
		{children}
	</label>
);

const DesignInspectorContent: React.FC = () => {
	const location = useLocation();
	const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
	const enabled = query.get('design') === '1' || query.get('design') === 'true';

	const { design, updateDesignLocal, saveDesignToDBV2, refreshDesign } = useDesign() as any;
	const { activeElement, viewport } = useEditorOverlay();

	const [primary, setPrimary] = React.useState<string>(design?.colors?.primary || '');
	const [activeSectionId, setActiveSectionId] = React.useState<string>('hero');
	const [padMobile, setPadMobile] = React.useState<string>(
		design?.sections?.hero?.layout?.padding?.mobile || ''
	);
	const [padDesktop, setPadDesktop] = React.useState<string>(
		design?.sections?.hero?.layout?.padding?.desktop || ''
	);
	const [innerWidth, setInnerWidth] = React.useState<string>(
		(design?.sections?.hero?.layout?.inner as any)?.width || ''
	);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [saved, setSaved] = React.useState(false);

	React.useEffect(() => {
		setPrimary(design?.colors?.primary || '');
		setPadMobile(design?.sections?.[activeSectionId]?.layout?.padding?.mobile || '');
		setPadDesktop(design?.sections?.[activeSectionId]?.layout?.padding?.desktop || '');
		setInnerWidth((design?.sections?.[activeSectionId]?.layout?.inner as any)?.width || '');
	}, [design, activeSectionId]);

	// Update active section from context (Provider-Only architecture)
	React.useEffect(() => {
		if (activeElement?.sectionId && activeElement.sectionId !== activeSectionId) {
			setActiveSectionId(activeElement.sectionId);
		}
	}, [activeElement?.sectionId, activeSectionId]);

	if (!enabled) return null;

	const applyPreview = () => {
		setSaved(false);
		setError(null);
		const updatedDesign = ((prev: any) => {
			const next = { ...prev };
			next.colors = { ...next.colors, primary };
			next.sections = next.sections || {};
			const sid = activeSectionId || 'hero';
			next.sections[sid] = next.sections[sid] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' } } } };
			next.sections[sid].layout = {
				...next.sections[sid].layout,
				padding: {
					...next.sections[sid].layout.padding,
					mobile: padMobile,
					desktop: padDesktop,
				},
			};
			(next.sections[sid].layout.inner as any) = {
				...next.sections[sid].layout.inner,
				width: innerWidth,
			};
			return next;
		})(design);
		updateDesignLocal(() => updatedDesign);
	};

	const save = async () => {
		try {
			setSaving(true);
			setSaved(false);
			setError(null);
			await saveDesignToDBV2();
			setSaved(true);
		} catch (e: any) {
			setError(e?.message || 'Failed to save design');
		} finally {
			setSaving(false);
		}
	};

	const revert = async () => {
		setError(null);
		setSaved(false);
		await refreshDesign();
	};

	// ---------------- Schema-driven token editor helpers -----------------
	const getValueByPath = (root: any, path: string): any => {
		const parts = path.split('.');
		let obj: any = root;
		for (const p of parts) {
			if (!obj) return undefined;
			obj = obj[p];
		}
		return obj;
	};

	const setValueByPath = (root: any, path: string, field: string, value: any) => {
		const parts = path.split('.');
		const next: any = { ...root };
		let obj: any = next;
		for (let i = 0; i < parts.length; i++) {
			const key = parts[i];
			obj[key] = obj[key] ? { ...obj[key] } : {};
			obj = obj[key];
		}
		obj[field] = value;
		return next;
	};

	const resolveDesignPath = (tokenPath: string): string => {
		// v2 canonical namespaces: pass-through
		if (
			tokenPath.startsWith('tokens.') ||
			tokenPath.startsWith('components.') ||
			tokenPath.startsWith('sections.')
		) {
			return tokenPath;
		}
		// v1 shorthand → map to v2 tokens when appropriate
		if (tokenPath === 'headings') return 'tokens.typography.headings';
		if (tokenPath === 'hero_headings') return 'tokens.typography.hero_headings';
		if (tokenPath === 'preTitle') return 'tokens.typography.preTitle';
		if (tokenPath === 'titleDescription') return 'tokens.typography.titleDescription';
		if (tokenPath.startsWith('typography.')) return `tokens.${tokenPath}`; // typography.* → tokens.typography.*
		// legacy buckets left as-is
		if (tokenPath.startsWith('buttonStyles.')) return tokenPath;
		if (tokenPath.startsWith('buttons.')) return tokenPath;
		if (tokenPath === 'travelPackageCard') return tokenPath;
		// fallback: assume typography token
		return `tokens.typography.${tokenPath}`;
	};

	const renderTokenEditor = (tokenPath: string, niceLabel?: string) => {
		const path = resolveDesignPath(tokenPath);
		const token = getValueByPath(design, path) || {};

		// Leaf value editor for direct paths like components.button.variants.primary.backgroundColor
		if (!token || typeof token !== 'object') {
			const lastDot = path.lastIndexOf('.');
			if (lastDot === -1) return null;
			const parent = path.substring(0, lastDot);
			const field = path.substring(lastDot + 1);
			const current = getValueByPath(design, path);
			if (current === undefined) return null;
			const isColor = /color$/i.test(field);
			return (
				<div style={{ display: 'grid', gap: 6 }}>
					<PanelRow label={`${niceLabel || tokenPath}`}>
						{isColor ? (
							<ColorSwatch
								value={current || ''}
								onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, parent, field, val))}
								placeholder="#ffffff"
							/>
						) : (
							<SmartInput
								value={current || ''}
								onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, parent, field, val))}
								placeholder="e.g. 1rem"
								label={path}
								style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
							/>
						)}
					</PanelRow>
				</div>
			);
		}

		// Only treat as responsive if md/lg keys exist. If only fontSize exists, edit that directly.
		const hasResponsive = ('fontSizeMd' in token) || ('fontSizeLg' in token);
		const sizeKey = hasResponsive
			? (viewport === 'desktop' ? 'fontSizeLg' : viewport === 'mobile' ? 'fontSize' : 'fontSizeMd')
			: 'fontSize';

		const isButtons = path.startsWith('buttons.') || path.startsWith('components.button.variants');
		const isTravelCard = path === 'travelPackageCard';

		return (
			<div style={{ display: 'grid', gap: 6 }}>
				{'fontFamily' in token && (
					<PanelRow label={`${niceLabel || tokenPath}.fontFamily`}>
						<input
							value={token.fontFamily || ''}
							onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'fontFamily', e.target.value))}
							placeholder="e.g. Inter, sans-serif"
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
						/>
					</PanelRow>
				)}

				{('fontSize' in token || 'fontSizeMd' in token || 'fontSizeLg' in token) && (
					<PanelRow label={`${niceLabel || tokenPath}.fontSize${hasResponsive ? ` (${viewport})` : ''}`}>
						<SmartInput
							value={token[sizeKey] || ''}
							onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, sizeKey, val))}
							placeholder="e.g. 1rem"
							label={`${niceLabel || tokenPath}.fontSize`}
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
						/>
					</PanelRow>
				)}

				{'lineHeight' in token && (
					<PanelRow label={`${niceLabel || tokenPath}.lineHeight`}>
						<SmartInput
							value={token.lineHeight || ''}
							onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'lineHeight', val))}
							placeholder="e.g. 1.5"
							label={`${niceLabel || tokenPath}.lineHeight`}
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
						/>
					</PanelRow>
				)}

				{'fontWeight' in token && (
					<PanelRow label={`${niceLabel || tokenPath}.fontWeight`}>
						<SmartInput
							value={token.fontWeight || ''}
							onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'fontWeight', val))}
							placeholder="e.g. 400"
							label={`${niceLabel || tokenPath}.fontWeight`}
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
						/>
					</PanelRow>
				)}

				{'letterSpacing' in token && (
					<PanelRow label={`${niceLabel || tokenPath}.letterSpacing`}>
						<SmartInput
							value={token.letterSpacing || ''}
							onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'letterSpacing', val))}
							placeholder="e.g. -0.025em"
							label={`${niceLabel || tokenPath}.letterSpacing`}
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
						/>
					</PanelRow>
				)}

				{'color' in token && (
					<PanelRow label={`${niceLabel || tokenPath}.color`}>
						<ColorSwatch
							value={token.color || ''}
							onChange={(value) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'color', value))}
							placeholder="e.g. #ffffff"
						/>
					</PanelRow>
				)}

				{/* Travel Package Card layout tokens */}
				{isTravelCard && (
					<>
						{'minHeight' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.minHeight`}>
								<SmartInput
									value={token.minHeight || ''}
									onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'minHeight', val))}
									placeholder="e.g. 70vh"
									label={`${niceLabel || tokenPath}.minHeight`}
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
						{'maxHeight' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.maxHeight`}>
								<SmartInput
									value={token.maxHeight || ''}
									onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'maxHeight', val))}
									placeholder="e.g. 70vh"
									label={`${niceLabel || tokenPath}.maxHeight`}
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
						{'imageHeight' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.imageHeight`}>
								<SmartInput
									value={token.imageHeight || ''}
									onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'imageHeight', val))}
									placeholder="e.g. 55%"
									label={`${niceLabel || tokenPath}.imageHeight`}
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
						{'contentPadding' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.contentPadding`}>
								<SmartInput
									value={token.contentPadding || ''}
									onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'contentPadding', val))}
									placeholder="e.g. .5rem"
									label={`${niceLabel || tokenPath}.contentPadding`}
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
					</>
				)}

				{/* Buttons token editors */}
				{isButtons && (
					<>
						{'text' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.text`}>
								<input
									value={token.text || ''}
									onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'text', e.target.value))}
									placeholder="Button label"
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
						{'bg' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.bg`}>
								<ColorSwatch
									value={token.bg || ''}
									onChange={(value) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'bg', value))}
									placeholder="e.g. bg-yellow-500 or #eab308"
								/>
							</PanelRow>
						)}
						{'hover' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.hover`}>
								<input
									value={token.hover || ''}
									onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'hover', e.target.value))}
									placeholder="e.g. hover:bg-yellow-600"
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
						{'textColor' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.textColor`}>
								<ColorSwatch
									value={token.textColor || ''}
									onChange={(value) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'textColor', value))}
									placeholder="e.g. text-black or #000000"
								/>
							</PanelRow>
						)}
						{'fontWeight' in token && (
							<PanelRow label={`${niceLabel || tokenPath}.fontWeight`}>
								<SmartInput
									value={token.fontWeight || ''}
									onChange={(val) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'fontWeight', val))}
									placeholder="e.g. font-normal or 400"
									label={`${niceLabel || tokenPath}.fontWeight`}
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
								/>
							</PanelRow>
						)}
					</>
				)}
			</div>
		);
	};

	return (
		<div style={{ display: 'grid', gap: 10 }}>
			{activeElement && (
				<div style={{ border: '1px solid #2a2a2a', borderRadius: 8, padding: 10, background: '#121212' }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
						<div style={{ color: '#f8fafc', fontSize: 12 }}>Selected: <strong>{activeElement.label}</strong></div>
						<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
							{viewport === 'desktop' ? <Monitor size={14} color="#a1a1aa" /> : <Smartphone size={14} color="#a1a1aa" />}
						</div>
					</div>
					{activeElement.tokenMatches.length === 0 && (
						<div style={{ fontSize: 12, color: '#94a3b8' }}>No global tokens detected. Local overrides coming soon.</div>
					)}
					{activeElement.tokenMatches.map((m, idx) => (
						<div key={idx} style={{ display: 'grid', gap: 6, padding: '8px 0', borderTop: idx ? '1px dashed #222' : 'none' }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ color: '#e5e7eb', fontSize: 12 }}>{m.label} <span style={{ opacity: 0.6 }}>({m.tokenPath})</span></div>
								{m.responsive && (
									<div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#a1a1aa' }}>
										<span>mobile</span>
										<span>tablet</span>
										<span>desktop</span>
									</div>
								)}
							</div>
							{/* Minimal editors: hero_headings */}
							{m.tokenPath === 'hero_headings' && (
								<div style={{ display: 'grid', gap: 6 }}>
									{/* fontFamily */}
									<PanelRow label="hero_headings.fontFamily">
										<input
											value={design?.hero_headings?.fontFamily || ''}
											onChange={(e) => updateDesignLocal((prev: any) => ({
												...prev,
												hero_headings: { ...(prev.hero_headings || {}), fontFamily: e.target.value }
											}))}
											placeholder="e.g. Inter, sans-serif"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* fontSize responsive */}
									<PanelRow label={`hero_headings.fontSize (${viewport})`}>
										<SmartInput
											value={viewport === 'mobile' ? (design?.hero_headings?.fontSize || '') : viewport === 'desktop' ? (design?.hero_headings?.fontSizeLg || '') : (design?.hero_headings?.fontSizeMd || '')}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.hero_headings = { ...next.hero_headings };
													if (viewport === 'mobile') next.hero_headings.fontSize = val; else if (viewport === 'desktop') next.hero_headings.fontSizeLg = val; else next.hero_headings.fontSizeMd = val;
													return next;
												});
											}}
											placeholder="e.g. 3.5rem"
											label="hero_headings.fontSize"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6 }}
										/>
									</PanelRow>

									{/* lineHeight */}
									<PanelRow label="hero_headings.lineHeight">
										<SmartInput
											value={design?.hero_headings?.lineHeight || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												hero_headings: { ...(prev.hero_headings || {}), lineHeight: val }
											}))}
											placeholder="e.g. 1"
											label="hero_headings.lineHeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* fontWeight */}
									<PanelRow label="hero_headings.fontWeight">
										<SmartInput
											value={design?.hero_headings?.fontWeight || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												hero_headings: { ...(prev.hero_headings || {}), fontWeight: val }
											}))}
											placeholder="e.g. 400"
											label="hero_headings.fontWeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* letterSpacing */}
									<PanelRow label="hero_headings.letterSpacing">
										<SmartInput
											value={design?.hero_headings?.letterSpacing || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												hero_headings: { ...(prev.hero_headings || {}), letterSpacing: val }
											}))}
											placeholder="e.g. -0.025em"
											label="hero_headings.letterSpacing"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* color */}
									<PanelRow label="hero_headings.color">
										<ColorSwatch
											value={design?.hero_headings?.color || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.hero_headings = { ...next.hero_headings };
													next.hero_headings.color = val;
													return next;
												});
											}}
											placeholder="#111827"
										/>
									</PanelRow>
								</div>
							)}
							{/* Minimal editors: body text */}
							{m.tokenPath === 'typography.body' && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="body.fontSize">
										<SmartInput
											value={design?.typography?.body?.fontSize || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.typography = { ...next.typography };
													next.typography.body = { ...next.typography.body };
													next.typography.body.fontSize = val;
													return next;
												});
											}}
											placeholder="e.g. 1rem"
											label="body.fontSize"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
									<PanelRow label="body.lineHeight">
										<SmartInput
											value={design?.typography?.body?.lineHeight || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.typography = { ...next.typography };
													next.typography.body = { ...next.typography.body };
													next.typography.body.lineHeight = val;
													return next;
												});
											}}
											placeholder="e.g. 1.75"
											label="body.lineHeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
									<PanelRow label="body.color">
										<ColorSwatch
											value={design?.typography?.body?.color || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													if (!next.typography) next.typography = {};
													if (!next.typography.body) next.typography.body = {};
													next.typography.body.color = val;
													return next;
												});
											}}
											placeholder="#111827"
										/>
									</PanelRow>
									<PanelRow label="body.fontWeight">
										<SmartInput
											value={design?.typography?.body?.fontWeight || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.typography = { ...next.typography };
													next.typography.body = { ...next.typography.body };
													next.typography.body.fontWeight = val;
													return next;
												});
											}}
											placeholder="e.g. 400"
											label="body.fontWeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Minimal editors: headings */}
							{m.tokenPath === 'headings' && (
								<div style={{ display: 'grid', gap: 6 }}>
									{/* fontFamily */}
									<PanelRow label="headings.fontFamily">
										<input
											value={design?.headings?.fontFamily || ''}
											onChange={(e) => updateDesignLocal((prev: any) => ({
												...prev,
												headings: { ...(prev.headings || {}), fontFamily: e.target.value }
											}))}
											placeholder="e.g. Inter, sans-serif"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* fontSize responsive */}
									<PanelRow label={`headings.fontSize (${viewport})`}>
										<SmartInput
											value={viewport === 'mobile' ? (design?.headings?.fontSize || '') : viewport === 'desktop' ? (design?.headings?.fontSizeLg || '') : (design?.headings?.fontSizeMd || '')}
											onChange={(val) => {
											updateDesignLocal((prev: any) => {
												const next = { ...prev };
												next.headings = { ...next.headings };
												if (viewport === 'mobile') next.headings.fontSize = val; else if (viewport === 'desktop') next.headings.fontSizeLg = val; else next.headings.fontSizeMd = val;
												return next;
											});
										}}
										placeholder="e.g. 2.5rem"
										label="headings.fontSize"
										style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* lineHeight */}
									<PanelRow label="headings.lineHeight">
										<SmartInput
											value={design?.headings?.lineHeight || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												headings: { ...(prev.headings || {}), lineHeight: val }
											}))}
											placeholder="e.g. 1.2"
											label="headings.lineHeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* fontWeight */}
									<PanelRow label="headings.fontWeight">
										<SmartInput
											value={design?.headings?.fontWeight || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												headings: { ...(prev.headings || {}), fontWeight: val }
											}))}
											placeholder="e.g. 700"
											label="headings.fontWeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* letterSpacing */}
									<PanelRow label="headings.letterSpacing">
										<SmartInput
											value={design?.headings?.letterSpacing || ''}
											onChange={(val) => updateDesignLocal((prev: any) => ({
												...prev,
												headings: { ...(prev.headings || {}), letterSpacing: val }
											}))}
											placeholder="e.g. -0.02em"
											label="headings.letterSpacing"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>

									{/* color */}
									<PanelRow label="headings.color">
										<ColorSwatch
											value={design?.headings?.color || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.headings = { ...next.headings, color: val };
													return next;
												});
											}}
											placeholder="e.g. #000000"
										/>
									</PanelRow>
								</div>
							)}
							{/* Section padding controls */}
							{m.tokenPath.includes('.layout.padding') && !m.tokenPath.includes('.inner.padding') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label={`Section Padding (${viewport})`}>
										<input
											type="text"
											value={
												viewport === 'mobile' ? (design?.sections?.[activeSectionId]?.layout?.padding?.mobile || '')
												: viewport === 'desktop' ? (design?.sections?.[activeSectionId]?.layout?.padding?.desktop || '')
												: (design?.sections?.[activeSectionId]?.layout?.padding?.tablet || '')
											}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													const pad = next.sections[activeSectionId].layout.padding;
													if (viewport === 'mobile') pad.mobile = val; else if (viewport === 'desktop') pad.desktop = val; else pad.tablet = val;
													return next;
												});
											}}
											placeholder="e.g. 4rem 1rem"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner padding controls */}
							{m.tokenPath.includes('.layout.inner.padding') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label={`Inner Padding (${viewport})`}>
										<input
											type="text"
											value={
												viewport === 'mobile' ? (design?.sections?.[activeSectionId]?.layout?.inner?.padding?.mobile || '')
												: viewport === 'desktop' ? (design?.sections?.[activeSectionId]?.layout?.inner?.padding?.desktop || '')
												: (design?.sections?.[activeSectionId]?.layout?.inner?.padding?.tablet || '')
											}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													const innerPad = next.sections[activeSectionId].layout.inner.padding;
													if (viewport === 'mobile') innerPad.mobile = val; else if (viewport === 'desktop') innerPad.desktop = val; else innerPad.tablet = val;
													return next;
												});
											}}
											placeholder="e.g. 2rem 1rem"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner width controls */}
							{m.tokenPath.includes('.layout.inner.width') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Width">
										<SmartInput
											value={design?.sections?.[activeSectionId]?.layout?.inner?.width || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' } } };
													next.sections[activeSectionId].layout.inner.width = val;
													return next;
												});
											}}
											placeholder="e.g. 100%, auto, 1280px"
											label="inner.width"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner min-width controls */}
							{m.tokenPath.includes('.layout.inner.minWidth') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Min Width">
										<SmartInput
											value={(design?.sections?.[activeSectionId]?.layout?.inner as any)?.minWidth || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													(next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' } } });
													(next.sections[activeSectionId].layout.inner as any).minWidth = val;
													return next;
												});
											}}
											placeholder="e.g. 320px"
											label="inner.minWidth"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner max-width controls */}
							{m.tokenPath.includes('.layout.inner.maxWidth') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Max Width">
										<SmartInput
											value={design?.sections?.[activeSectionId]?.layout?.inner?.maxWidth || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' } } };
													next.sections[activeSectionId].layout.inner.maxWidth = val;
													return next;
												});
											}}
											placeholder="e.g. 100%, 1280px, none"
											label="inner.maxWidth"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner min-height controls */}
							{m.tokenPath.includes('.layout.inner.minHeight') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Min Height">
										<SmartInput
											value={(design?.sections?.[activeSectionId]?.layout?.inner as any)?.minHeight || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													(next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' } } });
													(next.sections[activeSectionId].layout.inner as any).minHeight = val;
													return next;
												});
											}}
											placeholder="e.g. 60vh"
											label="inner.minHeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner height controls */}
							{m.tokenPath.includes('.layout.inner.height') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Height">
										<SmartInput
											value={(design?.sections?.[activeSectionId]?.layout?.inner as any)?.height || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													(next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' } } });
													(next.sections[activeSectionId].layout.inner as any).height = val;
													return next;
												});
											}}
											placeholder="e.g. auto, 80vh"
											label="inner.height"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Section background color controls */}
							{m.tokenPath.includes('.layout.backgroundColor') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Section Background Color">
										<ColorSwatch
											value={design?.sections?.[activeSectionId]?.layout?.backgroundColor || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.backgroundColor = val;
													return next;
												});
											}}
											placeholder="e.g. #000000 or transparent"
										/>
									</PanelRow>
								</div>
							)}
							{/* Inner section background color controls */}
							{m.tokenPath.includes('.layout.inner.backgroundColor') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Inner Background Color">
										<ColorSwatch
											value={design?.sections?.[activeSectionId]?.layout?.inner?.backgroundColor || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.backgroundColor = val;
													return next;
												});
											}}
											placeholder="e.g. #ffffff or transparent"
										/>
									</PanelRow>
								</div>
							)}
							{/* Background image URL controls */}
							{m.tokenPath.includes('.background.value') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Background Image URL">
										<input
											type="text"
											value={design?.sections?.[activeSectionId]?.layout?.inner?.background?.value || ''}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'image', value: '' } } } };
													if (!next.sections[activeSectionId].layout.inner.background) {
														next.sections[activeSectionId].layout.inner.background = { type: 'image', value: '' };
													}
													next.sections[activeSectionId].layout.inner.background.value = val;
													next.sections[activeSectionId].layout.inner.background.type = val ? 'image' : 'color';
													return next;
												});
											}}
											placeholder="e.g. /hero_hugo.avif"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{/* Background overlay color controls */}
							{m.tokenPath.includes('.overlay.color') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Background Overlay Color">
										<ColorSwatch
											value={design?.sections?.[activeSectionId]?.layout?.inner?.background?.overlay?.color || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													if (!next.sections[activeSectionId].layout.inner.background) {
														next.sections[activeSectionId].layout.inner.background = { type: 'color', value: 'transparent' };
													}
													if (!next.sections[activeSectionId].layout.inner.background.overlay) {
														next.sections[activeSectionId].layout.inner.background.overlay = { color: '' };
													}
													next.sections[activeSectionId].layout.inner.background.overlay.color = val;
													return next;
												});
											}}
											placeholder="e.g. rgba(0,0,0,0.5)"
										/>
									</PanelRow>
								</div>
							)}
							{/* Flex layout controls */}
							{m.tokenPath.includes('.layout.inner.display') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Display Type">
										<select
											value={design?.sections?.[activeSectionId]?.layout?.inner?.display || 'block'}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.display = val;
													return next;
												});
											}}
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										>
											<option value="block">Block</option>
											<option value="flex">Flex</option>
											<option value="grid">Grid</option>
											<option value="inline-block">Inline Block</option>
										</select>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.includes('.layout.inner.flexDirection') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Flex Direction">
										<select
											value={design?.sections?.[activeSectionId]?.layout?.inner?.flexDirection || 'column'}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.flexDirection = val;
													return next;
												});
											}}
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										>
											<option value="row">Row</option>
											<option value="column">Column</option>
											<option value="row-reverse">Row Reverse</option>
											<option value="column-reverse">Column Reverse</option>
										</select>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.includes('.layout.inner.alignItems') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Align Items (Vertical)">
										<select
											value={design?.sections?.[activeSectionId]?.layout?.inner?.alignItems || 'stretch'}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.alignItems = val;
													return next;
												});
											}}
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										>
											<option value="stretch">Stretch</option>
											<option value="flex-start">Start</option>
											<option value="center">Center</option>
											<option value="flex-end">End</option>
											<option value="baseline">Baseline</option>
										</select>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.includes('.layout.inner.justifyContent') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Justify Content (Horizontal)">
										<select
											value={design?.sections?.[activeSectionId]?.layout?.inner?.justifyContent || 'flex-start'}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.justifyContent = val;
													return next;
												});
											}}
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										>
											<option value="flex-start">Start</option>
											<option value="center">Center</option>
											<option value="flex-end">End</option>
											<option value="space-between">Space Between</option>
											<option value="space-around">Space Around</option>
											<option value="space-evenly">Space Evenly</option>
										</select>
									</PanelRow>
								</div>
							)}
							{/* Border controls */}
							{m.tokenPath.includes('.layout.inner.borderRadius') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Border Radius">
										<SmartInput
											value={design?.sections?.[activeSectionId]?.layout?.inner?.borderRadius || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.borderRadius = val;
													next.sections[activeSectionId].layout.inner.rounded = val ? true : false;
													return next;
												});
											}}
											placeholder="e.g. 8px or 0.5rem"
											label="inner.borderRadius"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.includes('.layout.inner.border') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Border Style">
										<input
											type="text"
											value={design?.sections?.[activeSectionId]?.layout?.inner?.border || ''}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.border = val;
													return next;
												});
											}}
											placeholder="e.g. 1px solid or 2px dashed"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.includes('.layout.inner.borderColor') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label="Border Color">
										<ColorSwatch
											value={design?.sections?.[activeSectionId]?.layout?.inner?.borderColor || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.sections = next.sections || {};
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' }, display: 'block', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' } } };
													next.sections[activeSectionId].layout.inner.borderColor = val;
													return next;
												});
											}}
											placeholder="e.g. #cccccc"
										/>
									</PanelRow>
								</div>
							)}
							{/* Generic fallback editor for any matched tokenPath */}
							{!(
								['hero_headings', 'typography.body', 'headings'].includes(m.tokenPath) ||
								(m.tokenPath.startsWith('sections.') && m.tokenPath.endsWith('.layout.padding')) ||
								(m.tokenPath.includes('.layout.backgroundColor')) ||
								(m.tokenPath.includes('.layout.inner.backgroundColor')) ||
								(m.tokenPath.includes('.background.value')) ||
								(m.tokenPath.includes('.overlay.color')) ||
								(m.tokenPath.includes('.layout.inner.display')) ||
								(m.tokenPath.includes('.layout.inner.flexDirection')) ||
								(m.tokenPath.includes('.layout.inner.alignItems')) ||
								(m.tokenPath.includes('.layout.inner.justifyContent')) ||
								(m.tokenPath.includes('.layout.inner.borderRadius')) ||
								(m.tokenPath.includes('.layout.inner.border')) ||
								(m.tokenPath.includes('.layout.inner.borderColor'))
							) && (
								renderTokenEditor(m.tokenPath, m.label)
							)}
						</div>
					))}
				</div>
			)}
			<div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
				Click any element to edit its design tokens
			</div>
			<div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
				<button onClick={save} disabled={saving} style={{ padding: '8px 10px', background: '#2d6a4f', color: '#fff', borderRadius: 6, border: '1px solid #3a7' }}>{saving ? 'Saving…' : 'Save All Changes'}</button>
				<button onClick={revert} style={{ padding: '8px 10px', background: '#5c2121', color: '#fff', borderRadius: 6, border: '1px solid #7a3a3a' }}>Revert</button>
			</div>
			{saved && <div style={{ fontSize: 12, color: '#7ee787', textAlign: 'center' }}>Saved</div>}
			{error && <div style={{ fontSize: 12, color: '#ff7b72', textAlign: 'center' }}>{error}</div>}
			<div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center' }}>Tip: append <code>?design=1</code> to any URL to toggle this panel.</div>
		</div>
	);
};

export default DesignInspectorContent;


