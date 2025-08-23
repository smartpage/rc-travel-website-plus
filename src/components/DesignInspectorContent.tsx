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

			{/* Travel Package Card Design Editing */}
			{((activeElement?.cardType === 'travelPackageCard') || (activeElement?.label?.startsWith('card') && activeElement.sectionId)) && (
				<div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
						<span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
							Travel Package Card Design
						</span>
					</div>

					{/* Card Background Color */}
					<PanelRow label="Background Color">
						<ColorSwatch
							value={design?.components?.travelPackageCard?.backgroundColor || '#ffffff'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.backgroundColor = val;
								return newDesign;
							})}
							placeholder="#ffffff"
						/>
					</PanelRow>

					{/* Card Border */}
					<PanelRow label="Border Width">
						<SmartInput
							value={design?.components?.travelPackageCard?.borderWidth || '1px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.borderWidth = val;
								return newDesign;
							})}
							placeholder="1px"
							label="travelPackageCard.borderWidth"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Border Color */}
					<PanelRow label="Border Color">
						<ColorSwatch
							value={design?.components?.travelPackageCard?.borderColor || '#e5e7eb'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.borderColor = val;
								return newDesign;
							})}
							placeholder="#e5e7eb"
						/>
					</PanelRow>

					{/* Card Border Radius */}
					<PanelRow label="Border Radius">
						<SmartInput
							value={design?.components?.travelPackageCard?.borderRadius || '8px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.borderRadius = val;
								return newDesign;
							})}
							placeholder="8px"
							label="travelPackageCard.borderRadius"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Padding */}
					<PanelRow label="Padding">
						<SmartInput
							value={design?.components?.travelPackageCard?.padding || '16px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.padding = val;
								return newDesign;
							})}
							placeholder="16px"
							label="travelPackageCard.padding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Shadow */}
					<PanelRow label="Shadow">
						<SmartInput
							value={design?.components?.travelPackageCard?.shadow || '0 4px 6px -1px rgb(0 0 0 / 0.1)'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.shadow = val;
								return newDesign;
							})}
							placeholder="0 4px 6px -1px rgb(0 0 0 / 0.1)"
							label="travelPackageCard.shadow"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Hover Effect */}
					<PanelRow label="Hover Transform">
						<SmartInput
							value={design?.components?.travelPackageCard?.hoverTransform || 'translateY(-2px)'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.hoverTransform = val;
								return newDesign;
							})}
							placeholder="translateY(-2px)"
							label="travelPackageCard.hoverTransform"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Transition */}
					<PanelRow label="Transition">
						<SmartInput
							value={design?.components?.travelPackageCard?.transition || 'all 0.3s ease'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.transition = val;
								return newDesign;
							})}
							placeholder="all 0.3s ease"
							label="travelPackageCard.transition"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Dimensions */}
					<PanelRow label="Card Min Height">
						<SmartInput
							value={design?.components?.travelPackageCard?.minHeight || '400px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.minHeight = val;
								return newDesign;
							})}
							placeholder="400px"
							label="travelPackageCard.minHeight"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Card Max Height">
						<SmartInput
							value={design?.components?.travelPackageCard?.maxHeight || '600px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.maxHeight = val;
								return newDesign;
							})}
							placeholder="600px"
							label="travelPackageCard.maxHeight"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Image Height">
						<SmartInput
							value={design?.components?.travelPackageCard?.imageHeight || '250px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.imageHeight = val;
								return newDesign;
							})}
							placeholder="250px"
							label="travelPackageCard.imageHeight"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Card Inner Padding */}
					<PanelRow label="Inner Padding">
						<SmartInput
							value={design?.components?.travelPackageCard?.innerPadding || '16px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.innerPadding = val;
								return newDesign;
							})}
							placeholder="16px"
							label="travelPackageCard.innerPadding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Typography Controls */}
					<PanelRow label="Price Type Color">
						<ColorSwatch
							value={design?.tokens?.typography?.travelPackagePriceType?.color || '#666666'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackagePriceType) newDesign.tokens.typography.travelPackagePriceType = {};
								newDesign.tokens.typography.travelPackagePriceType.color = val;
								return newDesign;
							})}
							placeholder="#666666"
						/>
					</PanelRow>

					<PanelRow label="Price Type Font Size">
						<SmartInput
							value={design?.tokens?.typography?.travelPackagePriceType?.fontSize || '0.875rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackagePriceType) newDesign.tokens.typography.travelPackagePriceType = {};
								newDesign.tokens.typography.travelPackagePriceType.fontSize = val;
								return newDesign;
							})}
							placeholder="0.875rem"
							label="travelPackagePriceType.fontSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Price Value Color">
						<ColorSwatch
							value={design?.tokens?.typography?.travelPackagePriceValue?.color || '#1a1a1a'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackagePriceValue) newDesign.tokens.typography.travelPackagePriceValue = {};
								newDesign.tokens.typography.travelPackagePriceValue.color = val;
								return newDesign;
							})}
							placeholder="#1a1a1a"
						/>
					</PanelRow>

					<PanelRow label="Price Value Font Size">
						<SmartInput
							value={design?.tokens?.typography?.travelPackagePriceValue?.fontSize || '1.25rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackagePriceValue) newDesign.tokens.typography.travelPackagePriceValue = {};
								newDesign.tokens.typography.travelPackagePriceValue.fontSize = val;
								return newDesign;
							})}
							placeholder="1.25rem"
							label="travelPackagePriceValue.fontSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Includes Color">
						<ColorSwatch
							value={design?.tokens?.typography?.travelPackageIncludes?.color || '#666666'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackageIncludes) newDesign.tokens.typography.travelPackageIncludes = {};
								newDesign.tokens.typography.travelPackageIncludes.color = val;
								return newDesign;
							})}
							placeholder="#666666"
						/>
					</PanelRow>

					<PanelRow label="Includes Font Size">
						<SmartInput
							value={design?.tokens?.typography?.travelPackageIncludes?.fontSize || '0.875rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.tokens) newDesign.tokens = {};
								if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
								if (!newDesign.tokens.typography.travelPackageIncludes) newDesign.tokens.typography.travelPackageIncludes = {};
								newDesign.tokens.typography.travelPackageIncludes.fontSize = val;
								return newDesign;
							})}
							placeholder="0.875rem"
							label="travelPackageIncludes.fontSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Icon Color Controls */}
					<PanelRow label="Map Icon Color">
						<ColorSwatch
							value={design?.components?.travelPackageCard?.iconColors?.map || '#10b981'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
								newDesign.components.travelPackageCard.iconColors.map = val;
								return newDesign;
							})}
							placeholder="#10b981"
						/>
					</PanelRow>

					<PanelRow label="Check Icon Color">
						<ColorSwatch
							value={design?.components?.travelPackageCard?.iconColors?.check || '#10b981'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
								newDesign.components.travelPackageCard.iconColors.check = val;
								return newDesign;
							})}
							placeholder="#10b981"
						/>
					</PanelRow>

					<PanelRow label="Message Icon Color">
						<ColorSwatch
							value={design?.components?.travelPackageCard?.iconColors?.message || '#f59e0b'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
								newDesign.components.travelPackageCard.iconColors.message = val;
								return newDesign;
							})}
							placeholder="#f59e0b"
						/>
					</PanelRow>

					{/* Hover Shadow */}
					<PanelRow label="Hover Shadow">
						<SmartInput
							value={design?.components?.travelPackageCard?.hoverShadow || '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
								newDesign.components.travelPackageCard.hoverShadow = val;
								return newDesign;
							})}
							placeholder="0 10px 15px -3px rgb(0 0 0 / 0.1)"
							label="travelPackageCard.hoverShadow"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>
				</div>
			)}

			{/* Service Card Design Section */}
			{(activeElement?.cardType === 'serviceCard' || activeElement?.label?.startsWith('serviceCard')) && (
				<div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
						<span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
							Service Card Design
						</span>
					</div>

					{/* Variant Selection */}
					<PanelRow label="Card Variant">
						<select
							value={design?.components?.serviceCard?.activeVariant || 'standard'}
							onChange={(e) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
								newDesign.components.serviceCard.activeVariant = e.target.value;
								return newDesign;
							})}
							style={{
								width: '100%',
								padding: '8px',
								background: '#2a2a2a',
								color: '#fff',
								border: '1px solid #444',
								borderRadius: 4,
								fontSize: 12
							}}
						>
							<option value="standard">Standard</option>
							<option value="highlight">Highlight</option>
							<option value="featured">Featured</option>
						</select>
					</PanelRow>

					{(() => {
						const activeVariant = design?.components?.serviceCard?.activeVariant || 'standard';
						const variantPath = `design.components.serviceCard.variants.${activeVariant}`;

						return (
							<>
								{/* Common Card Properties */}
								<PanelRow label="Min Height">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.minHeight || '500px'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].minHeight = val;
											return newDesign;
										})}
										placeholder="500px"
										label={`${variantPath}.minHeight`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Max Height">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.maxHeight || 'none'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].maxHeight = val;
											return newDesign;
										})}
										placeholder="none"
										label={`${variantPath}.maxHeight`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Border Radius">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.borderRadius || '1rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].borderRadius = val;
											return newDesign;
										})}
										placeholder="1rem"
										label={`${variantPath}.borderRadius`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Padding">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.padding || '1rem 2rem 3rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].padding = val;
											return newDesign;
										})}
										placeholder="1rem 2rem 3rem"
										label={`${variantPath}.padding`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								{/* Variant-specific properties */}
								{activeVariant === 'standard' && (
									<>
										<PanelRow label="Background Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.standard?.backgroundColor || 'transparent'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.backgroundColor = val;
													return newDesign;
												})}
												placeholder="transparent"
											/>
										</PanelRow>

										<PanelRow label="Border Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.standard?.borderColor || '#1f2937'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.borderColor = val;
													return newDesign;
												})}
												placeholder="#1f2937"
											/>
										</PanelRow>

										<PanelRow label="Border Width">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.standard?.borderWidth || '1px'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.borderWidth = val;
													return newDesign;
												})}
												placeholder="1px"
												label="serviceCard.variants.standard.borderWidth"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>

										<PanelRow label="Shadow">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.standard?.shadow || 'none'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.shadow = val;
													return newDesign;
												})}
												placeholder="none"
												label="serviceCard.variants.standard.shadow"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>

										<PanelRow label="Icon Padding">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.standard?.iconPadding || '1rem 2rem 0'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.iconPadding = val;
													return newDesign;
												})}
												placeholder="1rem 2rem 0"
												label="serviceCard.variants.standard.iconPadding"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>

										<PanelRow label="Content Padding">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.standard?.contentPadding || '0 2rem 3rem'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.standard) newDesign.components.serviceCard.variants.standard = {};
													newDesign.components.serviceCard.variants.standard.contentPadding = val;
													return newDesign;
												})}
												placeholder="0 2rem 3rem"
												label="serviceCard.variants.standard.contentPadding"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>
									</>
								)}

								{activeVariant === 'highlight' && (
									<>
										<PanelRow label="Background Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.highlight?.backgroundColor || '#fbbf24'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.highlight) newDesign.components.serviceCard.variants.highlight = {};
													newDesign.components.serviceCard.variants.highlight.backgroundColor = val;
													return newDesign;
												})}
												placeholder="#fbbf24"
											/>
										</PanelRow>

										<PanelRow label="Text Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.highlight?.textColor || '#000000'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.highlight) newDesign.components.serviceCard.variants.highlight = {};
													newDesign.components.serviceCard.variants.highlight.textColor = val;
													return newDesign;
												})}
												placeholder="#000000"
											/>
										</PanelRow>

										<PanelRow label="Header Bar Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.highlight?.headerBarColor || '#000000'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.highlight) newDesign.components.serviceCard.variants.highlight = {};
													newDesign.components.serviceCard.variants.highlight.headerBarColor = val;
													return newDesign;
												})}
												placeholder="#000000"
											/>
										</PanelRow>

										<PanelRow label="Header Bar Height">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.highlight?.headerBarHeight || '4px'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.highlight) newDesign.components.serviceCard.variants.highlight = {};
													newDesign.components.serviceCard.variants.highlight.headerBarHeight = val;
													return newDesign;
												})}
												placeholder="4px"
												label="serviceCard.variants.highlight.headerBarHeight"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>
									</>
								)}

								{activeVariant === 'featured' && (
									<>
										<PanelRow label="Background Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.featured?.backgroundColor || 'transparent'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.featured) newDesign.components.serviceCard.variants.featured = {};
													newDesign.components.serviceCard.variants.featured.backgroundColor = val;
													return newDesign;
												})}
												placeholder="transparent"
											/>
										</PanelRow>

										<PanelRow label="Image Opacity">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.featured?.imageOpacity || '0.6'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.featured) newDesign.components.serviceCard.variants.featured = {};
													newDesign.components.serviceCard.variants.featured.imageOpacity = val;
													return newDesign;
												})}
												placeholder="0.6"
												label="serviceCard.variants.featured.imageOpacity"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>

										<PanelRow label="Overlay Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.featured?.overlayColor || 'rgba(0,0,0,0.4)'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.featured) newDesign.components.serviceCard.variants.featured = {};
													newDesign.components.serviceCard.variants.featured.overlayColor = val;
													return newDesign;
												})}
												placeholder="rgba(0,0,0,0.4)"
											/>
										</PanelRow>

										<PanelRow label="Header Bar Color">
											<ColorSwatch
												value={design?.components?.serviceCard?.variants?.featured?.headerBarColor || design?.tokens?.colors?.primary}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.featured) newDesign.components.serviceCard.variants.featured = {};
													newDesign.components.serviceCard.variants.featured.headerBarColor = val;
													return newDesign;
												})}
												placeholder="#3b82f6"
											/>
										</PanelRow>

										<PanelRow label="Header Bar Height">
											<SmartInput
												value={design?.components?.serviceCard?.variants?.featured?.headerBarHeight || '4px'}
												onChange={(val) => updateDesignLocal((prev: any) => {
													const newDesign = { ...prev };
													if (!newDesign.components) newDesign.components = {};
													if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
													if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
													if (!newDesign.components.serviceCard.variants.featured) newDesign.components.serviceCard.variants.featured = {};
													newDesign.components.serviceCard.variants.featured.headerBarHeight = val;
													return newDesign;
												})}
												placeholder="4px"
												label="serviceCard.variants.featured.headerBarHeight"
												style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
											/>
										</PanelRow>
									</>
								)}

								{/* Common Spacing Controls */}
								<PanelRow label="Icon Size">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.iconSize || '3rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].iconSize = val;
											return newDesign;
										})}
										placeholder="3rem"
										label={`${variantPath}.iconSize`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Icon Color">
									<ColorSwatch
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.iconColor || (activeVariant === 'standard' ? '#9ca3af' : 'white')}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].iconColor = val;
											return newDesign;
										})}
										placeholder="#9ca3af"
									/>
								</PanelRow>

								<PanelRow label="Icon Spacing">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.iconSpacing || '3rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].iconSpacing = val;
											return newDesign;
										})}
										placeholder="3rem"
										label={`${variantPath}.iconSpacing`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Title Spacing">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.titleSpacing || '1rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].titleSpacing = val;
											return newDesign;
										})}
										placeholder="1rem"
										label={`${variantPath}.titleSpacing`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Description Spacing">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.descriptionSpacing || '1rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].descriptionSpacing = val;
											return newDesign;
										})}
										placeholder="1rem"
										label={`${variantPath}.descriptionSpacing`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>

								<PanelRow label="Button Spacing">
									<SmartInput
										value={design?.components?.serviceCard?.variants?.[activeVariant]?.buttonSpacing || '1rem'}
										onChange={(val) => updateDesignLocal((prev: any) => {
											const newDesign = { ...prev };
											if (!newDesign.components) newDesign.components = {};
											if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
											if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
											if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
											newDesign.components.serviceCard.variants[activeVariant].buttonSpacing = val;
											return newDesign;
										})}
										placeholder="1rem"
										label={`${variantPath}.buttonSpacing`}
										style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
									/>
								</PanelRow>
							</>
						);
					})()}
				</div>
			)}

			{/* Testimonial Card Design Section */}
			{(activeElement?.cardType === 'testimonialCard' || activeElement?.label?.startsWith('testimonialCard')) && (
				<div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
						<span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
							Testimonial Card Design
						</span>
					</div>

					{/* Card Layout Controls */}
					<PanelRow label="Background Color">
						<ColorSwatch
							value={design?.components?.testimonialCard?.backgroundColor || 'transparent'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.backgroundColor = val;
								return newDesign;
							})}
							placeholder="transparent"
						/>
					</PanelRow>

					<PanelRow label="Border Color">
						<ColorSwatch
							value={design?.components?.testimonialCard?.borderColor || 'transparent'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.borderColor = val;
								return newDesign;
							})}
							placeholder="transparent"
						/>
					</PanelRow>

					<PanelRow label="Border Width">
						<SmartInput
							value={design?.components?.testimonialCard?.borderWidth || '1px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.borderWidth = val;
								return newDesign;
							})}
							placeholder="1px"
							label="testimonialCard.borderWidth"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Border Radius">
						<SmartInput
							value={design?.components?.testimonialCard?.borderRadius || '0.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.borderRadius = val;
								return newDesign;
							})}
							placeholder="0.5rem"
							label="testimonialCard.borderRadius"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Shadow">
						<SmartInput
							value={design?.components?.testimonialCard?.shadow || 'none'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.shadow = val;
								return newDesign;
							})}
							placeholder="none"
							label="testimonialCard.shadow"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Padding">
						<SmartInput
							value={design?.components?.testimonialCard?.padding || '1rem 1.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.padding = val;
								return newDesign;
							})}
							placeholder="1rem 1.5rem"
							label="testimonialCard.padding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Min Height">
						<SmartInput
							value={design?.components?.testimonialCard?.minHeight || 'auto'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.minHeight = val;
								return newDesign;
							})}
							placeholder="auto"
							label="testimonialCard.minHeight"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Avatar Controls */}
					<PanelRow label="Avatar Size">
						<SmartInput
							value={design?.components?.testimonialCard?.avatarSize || '5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.avatarSize = val;
								return newDesign;
							})}
							placeholder="5rem"
							label="testimonialCard.avatarSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Avatar Spacing">
						<SmartInput
							value={design?.components?.testimonialCard?.avatarSpacing || '1rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.avatarSpacing = val;
								return newDesign;
							})}
							placeholder="1rem"
							label="testimonialCard.avatarSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Star Rating Controls */}
					<PanelRow label="Star Size">
						<SmartInput
							value={design?.components?.testimonialCard?.starSize || '1rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.starSize = val;
								return newDesign;
							})}
							placeholder="1rem"
							label="testimonialCard.starSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Star Color">
						<ColorSwatch
							value={design?.components?.testimonialCard?.starColor || design?.tokens?.colors?.primary || '#fbbf24'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.starColor = val;
								return newDesign;
							})}
							placeholder="#fbbf24"
						/>
					</PanelRow>

					<PanelRow label="Rating Spacing">
						<SmartInput
							value={design?.components?.testimonialCard?.ratingSpacing || '0.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.ratingSpacing = val;
								return newDesign;
							})}
							placeholder="0.5rem"
							label="testimonialCard.ratingSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Spacing Controls */}
					<PanelRow label="Header Spacing">
						<SmartInput
							value={design?.components?.testimonialCard?.headerSpacing || '1rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.headerSpacing = val;
								return newDesign;
							})}
							placeholder="1rem"
							label="testimonialCard.headerSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Name Spacing">
						<SmartInput
							value={design?.components?.testimonialCard?.nameSpacing || '0.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.nameSpacing = val;
								return newDesign;
							})}
							placeholder="0.5rem"
							label="testimonialCard.nameSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Location Spacing">
						<SmartInput
							value={design?.components?.testimonialCard?.locationSpacing || '0.75rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.locationSpacing = val;
								return newDesign;
							})}
							placeholder="0.75rem"
							label="testimonialCard.locationSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Content Padding">
						<SmartInput
							value={design?.components?.testimonialCard?.contentPadding || '1rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.contentPadding = val;
								return newDesign;
							})}
							placeholder="1rem"
							label="testimonialCard.contentPadding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Text Styling Controls */}
					<PanelRow label="Text Style">
						<select
							value={design?.components?.testimonialCard?.textStyle || 'italic'}
							onChange={(e) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.textStyle = e.target.value;
								return newDesign;
							})}
							style={{
								width: '100%',
								padding: '8px',
								background: '#2a2a2a',
								color: '#fff',
								border: '1px solid #444',
								borderRadius: 4,
								fontSize: 12
							}}
						>
							<option value="normal">Normal</option>
							<option value="italic">Italic</option>
							<option value="oblique">Oblique</option>
						</select>
					</PanelRow>

					<PanelRow label="Max Text Width">
						<SmartInput
							value={design?.components?.testimonialCard?.maxTextWidth || 'none'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
								newDesign.components.testimonialCard.maxTextWidth = val;
								return newDesign;
							})}
							placeholder="none"
							label="testimonialCard.maxTextWidth"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>
				</div>
			)}

			{/* Why Feature Cards Design Section */}
			{(activeElement?.cardType === 'whyFeatureCard' || activeElement?.label?.startsWith('whyFeatureCard')) && (
				<div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
						<span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
							Why Feature Cards Design
						</span>
					</div>

					{/* Card Layout Controls */}
					<PanelRow label="Background Color">
						<ColorSwatch
							value={design?.components?.whyFeatureCard?.backgroundColor || design?.tokens?.colors?.background}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.backgroundColor = val;
								return newDesign;
							})}
							placeholder="#000000"
						/>
					</PanelRow>

					<PanelRow label="Border Color">
						<ColorSwatch
							value={design?.components?.whyFeatureCard?.borderColor || 'transparent'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.borderColor = val;
								return newDesign;
							})}
							placeholder="transparent"
						/>
					</PanelRow>

					<PanelRow label="Border Width">
						<SmartInput
							value={design?.components?.whyFeatureCard?.borderWidth || '1px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.borderWidth = val;
								return newDesign;
							})}
							placeholder="1px"
							label="whyFeatureCard.borderWidth"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Border Radius">
						<SmartInput
							value={design?.components?.whyFeatureCard?.borderRadius || '0.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.borderRadius = val;
								return newDesign;
							})}
							placeholder="0.5rem"
							label="whyFeatureCard.borderRadius"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Shadow">
						<SmartInput
							value={design?.components?.whyFeatureCard?.shadow || 'none'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.shadow = val;
								return newDesign;
							})}
							placeholder="none"
							label="whyFeatureCard.shadow"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Padding">
						<SmartInput
							value={design?.components?.whyFeatureCard?.padding || '2rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.padding = val;
								return newDesign;
							})}
							placeholder="2rem"
							label="whyFeatureCard.padding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Min Height">
						<SmartInput
							value={design?.components?.whyFeatureCard?.minHeight || '300px'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.minHeight = val;
								return newDesign;
							})}
							placeholder="300px"
							label="whyFeatureCard.minHeight"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Transition">
						<SmartInput
							value={design?.components?.whyFeatureCard?.transition || 'all 0.3s ease'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.transition = val;
								return newDesign;
							})}
							placeholder="all 0.3s ease"
							label="whyFeatureCard.transition"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Icon Controls */}
					<PanelRow label="Icon Size">
						<SmartInput
							value={design?.components?.whyFeatureCard?.iconSize || '4rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconSize = val;
								return newDesign;
							})}
							placeholder="4rem"
							label="whyFeatureCard.iconSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Icon Background">
						<ColorSwatch
							value={design?.components?.whyFeatureCard?.iconBackground || design?.tokens?.colors?.primary}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconBackground = val;
								return newDesign;
							})}
							placeholder="#3b82f6"
						/>
					</PanelRow>

					<PanelRow label="Icon Color">
						<ColorSwatch
							value={design?.components?.whyFeatureCard?.iconColor || 'black'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconColor = val;
								return newDesign;
							})}
							placeholder="black"
						/>
					</PanelRow>

					<PanelRow label="Icon Border Radius">
						<SmartInput
							value={design?.components?.whyFeatureCard?.iconBorderRadius || '50%'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconBorderRadius = val;
								return newDesign;
							})}
							placeholder="50%"
							label="whyFeatureCard.iconBorderRadius"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Icon Inner Size">
						<SmartInput
							value={design?.components?.whyFeatureCard?.iconInnerSize || '1.75rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconInnerSize = val;
								return newDesign;
							})}
							placeholder="1.75rem"
							label="whyFeatureCard.iconInnerSize"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Icon Spacing">
						<SmartInput
							value={design?.components?.whyFeatureCard?.iconSpacing || '1.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.iconSpacing = val;
								return newDesign;
							})}
							placeholder="1.5rem"
							label="whyFeatureCard.iconSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					{/* Content Layout Controls */}
					<PanelRow label="Content Padding">
						<SmartInput
							value={design?.components?.whyFeatureCard?.contentPadding || '2rem 0'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.contentPadding = val;
								return newDesign;
							})}
							placeholder="2rem 0"
							label="whyFeatureCard.contentPadding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Content Alignment">
						<select
							value={design?.components?.whyFeatureCard?.contentAlignment || 'center'}
							onChange={(e) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.contentAlignment = e.target.value;
								return newDesign;
							})}
							style={{
								width: '100%',
								padding: '8px',
								background: '#2a2a2a',
								color: '#fff',
								border: '1px solid #444',
								borderRadius: 4,
								fontSize: 12
							}}
						>
							<option value="center">Center</option>
							<option value="flex-start">Top</option>
							<option value="flex-end">Bottom</option>
							<option value="space-between">Space Between</option>
							<option value="space-around">Space Around</option>
						</select>
					</PanelRow>

					<PanelRow label="Title Spacing">
						<SmartInput
							value={design?.components?.whyFeatureCard?.titleSpacing || '1rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.titleSpacing = val;
								return newDesign;
							})}
							placeholder="1rem"
							label="whyFeatureCard.titleSpacing"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>

					<PanelRow label="Description Padding">
						<SmartInput
							value={design?.components?.whyFeatureCard?.descriptionPadding || '0 1.5rem'}
							onChange={(val) => updateDesignLocal((prev: any) => {
								const newDesign = { ...prev };
								if (!newDesign.components) newDesign.components = {};
								if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
								newDesign.components.whyFeatureCard.descriptionPadding = val;
								return newDesign;
							})}
							placeholder="0 1.5rem"
							label="whyFeatureCard.descriptionPadding"
							style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
						/>
					</PanelRow>
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


