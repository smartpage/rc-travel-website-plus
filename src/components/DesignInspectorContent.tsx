import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import SmartInput from '@/components/SmartInput';

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

	const { design, updateDesignLocal, saveDesignToAPI, refreshDesign } = useDesign() as any;
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
			await saveDesignToAPI();
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
		if (tokenPath.startsWith('typography.')) return tokenPath;
		// Known top-level families that live directly under design
		if (['headings', 'hero_headings', 'preTitle', 'titleDescription'].includes(tokenPath)) {
			return tokenPath;
		}
		// Other known top-level namespaces
		if (tokenPath.startsWith('buttonStyles.')) return tokenPath;
		if (tokenPath.startsWith('buttons.')) return tokenPath;
		if (tokenPath === 'travelPackageCard') return tokenPath;
		// Fallback: assume typography bucket
		return `typography.${tokenPath}`;
	};

	const renderTokenEditor = (tokenPath: string, niceLabel?: string) => {
		const path = resolveDesignPath(tokenPath);
		const token = getValueByPath(design, path) || {};

		// Nothing to render if not an object (or empty)
		if (!token || typeof token !== 'object') return null;

		// Only treat as responsive if md/lg keys exist. If only fontSize exists, edit that directly.
		const hasResponsive = ('fontSizeMd' in token) || ('fontSizeLg' in token);
		const sizeKey = hasResponsive
			? (viewport === 'desktop' ? 'fontSizeLg' : viewport === 'mobile' ? 'fontSize' : 'fontSizeMd')
			: 'fontSize';

		const isButtons = path.startsWith('buttons.');
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
						<input
							value={token.color || ''}
							onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'color', e.target.value))}
							placeholder="e.g. #ffffff"
							style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
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
								<input
									value={token.bg || ''}
									onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'bg', e.target.value))}
									placeholder="e.g. bg-yellow-500 or #eab308"
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
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
								<input
									value={token.textColor || ''}
									onChange={(e) => updateDesignLocal((prev: any) => setValueByPath(prev, path, 'textColor', e.target.value))}
									placeholder="e.g. text-black or #000000"
									style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
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
						<div style={{ display: 'flex', gap: 6 }}>
							<span style={{ fontSize: 11, color: '#a1a1aa' }}>Viewport:</span>
							<code style={{ fontSize: 11, color: '#c084fc' }}>{viewport}</code>
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
									<PanelRow label="hero_headings.color">
										<input
											value={design?.hero_headings?.color || ''}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.hero_headings = { ...next.hero_headings };
													next.hero_headings.color = val;
													return next;
												});
											}}
											placeholder="e.g. #ffffff"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
									<PanelRow label="hero_headings.fontWeight">
										<SmartInput
											value={design?.hero_headings?.fontWeight || ''}
											onChange={(val) => {
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.hero_headings = { ...next.hero_headings };
													next.hero_headings.fontWeight = val;
													return next;
												});
											}}
											placeholder="e.g. 700"
											label="hero_headings.fontWeight"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
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
										<input
											value={design?.typography?.body?.color || ''}
											onChange={(e) => {
												const val = e.target.value;
												updateDesignLocal((prev: any) => {
													const next = { ...prev };
													next.typography = { ...next.typography };
													next.typography.body = { ...next.typography.body };
													next.typography.body.color = val;
													return next;
												});
											}}
											placeholder="e.g. white"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
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
										<input
											value={design?.headings?.color || ''}
											onChange={(e) => {
											const val = e.target.value;
											updateDesignLocal((prev: any) => {
												const next = { ...prev };
												next.headings = { ...next.headings, color: val };
												return next;
											});
											}}
											placeholder="#111827"
											style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }}
										/>
									</PanelRow>
								</div>
							)}
							{m.tokenPath.startsWith('sections.') && m.tokenPath.endsWith('.layout.padding') && activeSectionId && (
								<div style={{ display: 'grid', gap: 6 }}>
									<PanelRow label={`${m.tokenPath}.${viewport}`}>
										<input
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
													next.sections[activeSectionId] = next.sections[activeSectionId] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' } } } };
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
							{/* Generic fallback editor for any matched tokenPath */}
							{!(
								['hero_headings', 'typography.body', 'headings'].includes(m.tokenPath) ||
								(m.tokenPath.startsWith('sections.') && m.tokenPath.endsWith('.layout.padding'))
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


