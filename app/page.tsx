'use client';

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';

interface TextElement {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  backgroundColor: string;
  backgroundColorEnabled: boolean;
  backgroundColorOpacity: number;
  fontColorOpacity: number;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('新しいテキスト');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Impact');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundColorEnabled, setBackgroundColorEnabled] = useState(false);
  const [backgroundColorOpacity, setBackgroundColorOpacity] = useState(1);
  const [fontColorOpacity, setFontColorOpacity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [previewFontColor, setPreviewFontColor] = useState<string | null>(null);
  const [xAlignment, setXAlignment] = useState<number | null>(null);
  const [yAlignment, setYAlignment] = useState<number | null>(null);
  // JSONインポート用inputのref
  const jsonInputRef = useRef<HTMLInputElement>(null);
  // 画像表示領域の余白・スケールを管理
  const [imageLayout, setImageLayout] = useState({
    offsetX: 0,
    offsetY: 0,
    displayW: 1,
    displayH: 1,
  });
  // プレビュー用canvasのref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  // canvas上でのテキスト選択・ドラッグ用state
  const [canvasDrag, setCanvasDrag] = useState({ dragging: false, dragId: null as string | null, offsetX: 0, offsetY: 0 });

  // 画像やコンテナのサイズが変わったときに余白・スケールを再計算
  useLayoutEffect(() => {
    if (!containerRef.current || !imageRef.current) return;
    const container = containerRef.current;
    const img = imageRef.current;
    const containerRect = container.getBoundingClientRect();
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerRect.width / containerRect.height;
    let displayW, displayH, offsetX, offsetY;
    if (imgAspect > containerAspect) {
      displayW = containerRect.width;
      displayH = containerRect.width / imgAspect;
      offsetX = 0;
      offsetY = (containerRect.height - displayH) / 2;
    } else {
      displayH = containerRect.height;
      displayW = containerRect.height * imgAspect;
      offsetX = (containerRect.width - displayW) / 2;
      offsetY = 0;
    }
    setImageLayout({ offsetX, offsetY, displayW, displayH });
  }, [image, textElements.length]);

  // プレビューcanvasの描画処理
  useEffect(() => {
    if (!image || !previewCanvasRef.current || !imageRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    // canvasのwidth/height属性とCSSサイズを一致させる
    canvas.width = Math.round(containerRect.width);
    canvas.height = Math.round(containerRect.height);
    canvas.style.width = `${containerRect.width}px`;
    canvas.style.height = `${containerRect.height}px`;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      ctx.clearRect(0, 0, containerRect.width, containerRect.height);
      ctx.drawImage(img, imageLayout.offsetX, imageLayout.offsetY, imageLayout.displayW, imageLayout.displayH);
      textElements.forEach(textElement => {
        const actualFontSize = textElement.fontSize;
        const actualX = imageLayout.offsetX + textElement.position.x;
        const actualY = imageLayout.offsetY + textElement.position.y;
        ctx.font = `bold ${actualFontSize}px ${textElement.fontFamily}`;
        if (textElement.backgroundColorEnabled && textElement.backgroundColor && textElement.backgroundColor !== '#ffffff') {
          const textMetrics = ctx.measureText(textElement.text);
          const textWidth = textMetrics.width;
          const textHeight = actualFontSize;
          const bgColor = textElement.backgroundColor;
          const opacity = textElement.backgroundColorOpacity;
          ctx.fillStyle = `rgba(${parseInt(bgColor.slice(1, 3), 16)}, ${parseInt(bgColor.slice(3, 5), 16)}, ${parseInt(bgColor.slice(5, 7), 16)}, ${opacity})`;
          ctx.fillRect(actualX - 4, actualY - 2, textWidth + 8, textHeight + 4);
        }
        const fontColor = textElement.fontColor;
        const fontOpacity = textElement.fontColorOpacity;
        ctx.fillStyle = `rgba(${parseInt(fontColor.slice(1, 3), 16)}, ${parseInt(fontColor.slice(3, 5), 16)}, ${parseInt(fontColor.slice(5, 7), 16)}, ${fontOpacity})`;
        ctx.strokeStyle = `rgba(0,0,0,${0.8 * fontOpacity})`;
        ctx.lineWidth = actualFontSize * 0.1;
        ctx.textBaseline = 'top';
        const lines = textElement.text.split('\n');
        lines.forEach((line, i) => {
          const y = actualY + i * actualFontSize * 1.2;
          ctx.strokeText(line, actualX, y);
          ctx.fillText(line, actualX, y);
        });
        if (textElement.fontColorOpacity > 0) {
          ctx.shadowColor = `rgba(0,0,0,${0.8 * fontOpacity})`;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.shadowBlur = 4;
          ctx.fillStyle = `rgba(${parseInt(fontColor.slice(1, 3), 16)}, ${parseInt(fontColor.slice(3, 5), 16)}, ${parseInt(fontColor.slice(5, 7), 16)}, ${fontOpacity})`;
          ctx.strokeStyle = `rgba(0,0,0,${0.8 * fontOpacity})`;
          ctx.lineWidth = actualFontSize * 0.1;
          ctx.textBaseline = 'top';
          lines.forEach((line, i) => {
            const yShadow = actualY + i * actualFontSize * 1.2 + 2;
            ctx.strokeText(line, actualX, yShadow);
            ctx.fillText(line, actualX, yShadow);
          });
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowBlur = 0;
        }
        if (selectedTextId === textElement.id) {
          const textMetrics = ctx.measureText(textElement.text);
          const textWidth = textMetrics.width;
          const textHeight = actualFontSize * lines.length * 1.2;
          ctx.save();
          ctx.strokeStyle = '#2196f3';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(actualX - 4, actualY - 2, textWidth + 8, textHeight + 4);
          ctx.setLineDash([]);
          ctx.restore();
        }
      });
    });
  }, [image, textElements, imageLayout, imageRef.current, containerRef.current, selectedTextId]);

  const fonts = [
    'Impact',
    'Michroma',
    'GTW',
    'Roboto',
    'Teko',
    'DejaVu Sans',
    'Liberation Sans',
    'Keepon Truckin',
    'Noto Sans',
    'Unknown Gothic'

  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setImage(e.target?.result as string);
            // 画像サイズに基づいてCanvasサイズを調整
            if (containerRef.current) {
              const container = containerRef.current;
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              
              // アスペクト比を保持しながらサイズを調整
              const imgAspectRatio = img.width / img.height;
              const containerAspectRatio = containerWidth / containerHeight;
              
              if (imgAspectRatio > containerAspectRatio) {
                // 横長画像の場合
                container.style.width = `${containerWidth}px`;
                container.style.height = `${containerWidth / imgAspectRatio}px`;
              } else {
                // 縦長画像の場合
                container.style.height = `${containerHeight}px`;
                container.style.width = `${containerHeight * imgAspectRatio}px`;
              }
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // テキスト追加時は画像左上基準で初期配置
  const addNewText = () => {
    const newText: TextElement = {
      id: Date.now().toString(),
      text: currentText,
      position: { x: 50, y: 50 }, // 画像左上基準
      fontSize,
      fontColor,
      fontFamily,
      backgroundColor: '#ffffff',
      backgroundColorEnabled,
      backgroundColorOpacity: 1,
      fontColorOpacity: 1
    };
    setTextElements(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
  };

  const handleTextClick = (textId: string) => {
    setSelectedTextId(textId);
    const textElement = textElements.find(t => t.id === textId);
    if (textElement) {
      setCurrentText(textElement.text);
      setFontSize(textElement.fontSize);
      setFontColor(textElement.fontColor);
      setFontFamily(textElement.fontFamily);
      setBackgroundColor(textElement.backgroundColor);
      setBackgroundColorEnabled(textElement.backgroundColorEnabled);
      setBackgroundColorOpacity(textElement.backgroundColorOpacity);
      setFontColorOpacity(textElement.fontColorOpacity);
    }
  };

  const updateSelectedText = () => {
    if (selectedTextId) {
      setTextElements(prev => prev.map(text => 
        text.id === selectedTextId 
          ? { ...text, text: currentText, fontSize, fontColor, fontFamily, backgroundColor, backgroundColorEnabled, backgroundColorOpacity, fontColorOpacity }
          : text
      ));
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) {
      updateSelectedText();
      e.currentTarget.blur();
      e.preventDefault();
    }
  };

  // テキスト移動時も画像左上基準
  const handleTextMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTextId(textId);
    
    const textElement = textElements.find(t => t.id === textId);
    if (textElement && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - imageLayout.offsetX - textElement.position.x,
        y: e.clientY - rect.top - imageLayout.offsetY - textElement.position.y
      });
    }
  }, [textElements, imageLayout]);

  // テキスト移動時も画像左上基準
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons === 1 && selectedTextId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = {
        x: e.clientX - rect.left - imageLayout.offsetX - dragOffset.x,
        y: e.clientY - rect.top - imageLayout.offsetY - dragOffset.y
      };
      setTextElements(prev => prev.map(text => 
        text.id === selectedTextId 
          ? { ...text, position: newPosition }
          : text
      ));
    }
  }, [selectedTextId, dragOffset, imageLayout]);

  const handleMouseUp = useCallback(() => {
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const deleteSelectedText = () => {
    if (selectedTextId) {
      setTextElements(prev => prev.filter(text => text.id !== selectedTextId));
      setSelectedTextId(null);
    }
  };

  const updateTextPosition = (axis: 'x' | 'y', value: number) => {
    if (!containerRef.current || !imageRef.current || !selectedTextId) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    const selectedText = textElements.find(t => t.id === selectedTextId);
    
    if (!selectedText) return;
    
    // 実際のテキスト要素のサイズを取得
    const textElement = document.querySelector(`[data-text-id="${selectedTextId}"]`) as HTMLElement;
    let textWidth = 0;
    let textHeight = 0;
    
    if (textElement) {
      const textRect = textElement.getBoundingClientRect();
      textWidth = textRect.width;
      textHeight = textRect.height;
    } else {
      // フォールバック：概算計算
      textWidth = selectedText.text.length * selectedText.fontSize * 0.2;
      textHeight = selectedText.fontSize * (selectedText.text.split('\n').length || 1);
    }
    
    let newPosition = { ...selectedText.position };
    
    if (axis === 'x') {
      // X軸配置: 0=左揃え, 0.5=センタリング, 1=右揃え
      if (value === 0) {
        newPosition.x = 0; // 左揃え
      } else if (value === 0.5) {
        newPosition.x = (imgRect.width - textWidth) / 2; // センタリング
      } else if (value === 1) {
        newPosition.x = imgRect.width - textWidth; // 右揃え
      }
    } else if (axis === 'y') {
      // Y軸配置: 0=上揃え, 0.5=センタリング, 1=下揃え
      if (value === 0) {
        newPosition.y = 0; // 上揃え
      } else if (value === 0.5) {
        newPosition.y = (imgRect.height - textHeight) / 2; // センタリング
      } else if (value === 1) {
        newPosition.y = imgRect.height - textHeight; // 下揃え
      }
    }
    
    setTextElements(prev => prev.map(text =>
      text.id === selectedTextId
        ? { ...text, position: newPosition }
        : text
    ));
  };

  const resetAll = () => {
    setImage(null);
    setTextElements([]);
    setSelectedTextId(null);
    setCurrentText('新しいテキスト');
    setFontSize(24);
    setFontColor('#ffffff');
    setFontFamily('Impact');
    setBackgroundColor('#ffffff');
    setBackgroundColorEnabled(false);
    setBackgroundColorOpacity(1);
    
    // Canvasサイズを元に戻す
    if (containerRef.current) {
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '600px';
    }
  };

  // canvas描画時のズレ補正パラメータ
  const FONT_SIZE_ADJUST = 0.92; // フォントサイズ補正係数（0.92〜0.97程度で調整）
  const Y_OFFSET_ADJUST = 0.08;  // Y座標補正（fontSizeに対して何割下げるか）

  const saveImage = async () => {
    if (!image || !imageRef.current || !previewCanvasRef.current) return;
    setIsSaving(true);
    try {
      // プレビューcanvasの内容をそのまま保存
      const canvas = previewCanvasRef.current;
      const link = document.createElement('a');
      link.download = 'text-overlay-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error saving image:', error);
      alert('画像の保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // JSONダウンロード関数
  const handleDownloadJson = () => {
    const data = {
      textElements,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    // 日時付きファイル名を生成
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileName = `boxart_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON読み込み処理
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.textElements)) setTextElements(data.textElements);
      } catch (err) {
        alert('JSONの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    // 選択状態をリセット
    e.target.value = '';
  };

  // canvas上のクリック・ドラッグイベントハンドラ
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!previewCanvasRef.current || !image) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    // 画像領域内かどうか判定
    if (
      x < imageLayout.offsetX ||
      y < imageLayout.offsetY ||
      x > imageLayout.offsetX + imageLayout.displayW ||
      y > imageLayout.offsetY + imageLayout.displayH
    ) {
      setSelectedTextId(null);
      return;
    }
    // 画像領域内のcanvas座標→画像内の座標に変換
    const imgX = x - imageLayout.offsetX;
    const imgY = y - imageLayout.offsetY;
    // テキスト要素の当たり判定
    for (let i = textElements.length - 1; i >= 0; i--) {
      const t = textElements[i];
      const fontSize = t.fontSize;
      const lines = t.text.split('\n');
      let maxWidth = 0;
      const ctx = previewCanvasRef.current.getContext('2d');
      if (!ctx) continue;
      ctx.font = `bold ${fontSize}px ${t.fontFamily}`;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
      }
      const height = fontSize * 1.2 * lines.length;
      const tx = t.position.x;
      const ty = t.position.y;
      if (imgX >= tx && imgX <= tx + maxWidth && imgY >= ty && imgY <= ty + height) {
        setSelectedTextId(t.id);
        setCanvasDrag({ dragging: true, dragId: t.id, offsetX: imgX - tx, offsetY: imgY - ty });
        return;
      }
    }
    setSelectedTextId(null);
  };
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!canvasDrag.dragging || !canvasDrag.dragId || !previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * (previewCanvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (previewCanvasRef.current.height / rect.height);
    setTextElements(prev => prev.map(t =>
      t.id === canvasDrag.dragId ? { ...t, position: { x: (x - canvasDrag.offsetX) / dpr, y: (y - canvasDrag.offsetY) / dpr } } : t
    ));
  };
  const handleCanvasMouseUp = () => {
    setCanvasDrag({ dragging: false, dragId: null, offsetX: 0, offsetY: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* コントロールパネル（左端1.5カラム→2カラム） */}
          <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">設定</h2>
            
            <div className="space-y-3">
              {/* テキスト追加ボタン */}
              <div>
                <button
                  onClick={addNewText}
                  className="w-full bg-blue-500 text-white py-2 px-3 rounded-md hover:bg-blue-600 transition-colors mb-2 text-sm"
                >
                  + テキスト追加
                </button>
                {selectedTextId && (
                  <button
                    onClick={deleteSelectedText}
                    className="w-full bg-red-500 text-white py-2 px-3 rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    - 選択テキスト削除
                  </button>
                )}
              </div>

              {/* 画像保存ボタン */}
              {image && textElements.length > 0 && (
                <>
                  <button
                    onClick={saveImage}
                    disabled={isSaving}
                    className="w-full bg-green-500 text-white py-2 px-3 rounded-md hover:bg-green-600 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '保存中...' : '💾 画像を保存'}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="w-full bg-yellow-500 text-white py-2 px-3 rounded-md hover:bg-yellow-600 transition-colors text-sm mt-2"
                  >
                    ⬇️ JSONとしてダウンロード
                  </button>
                </>
              )}

              {/* JSON読み込みボタン */}
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="w-full bg-yellow-600 text-white py-2 px-3 rounded-md hover:bg-yellow-700 transition-colors text-sm mb-2"
              >
                📂 JSON読み込み
              </button>
              <input
                type="file"
                accept="application/json"
                ref={jsonInputRef}
                onChange={handleImportJson}
                style={{ display: 'none' }}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  テキスト内容
                </label>
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  onBlur={updateSelectedText}
                  onKeyDown={handleTextKeyDown}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical text-gray-900 bg-white"
                  placeholder="テキストを入力してください"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フォント
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    // 即座に反映されるように即座に更新
                    if (selectedTextId) {
                      setTextElements(prev => prev.map(text => 
                        text.id === selectedTextId 
                          ? { ...text, fontFamily: e.target.value }
                          : text
                      ));
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                >
                  {fonts.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font, color: '#111' }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フォントサイズ: {fontSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setFontSize(newSize);
                    // 即座に反映されるように即座に更新
                    if (selectedTextId) {
                      setTextElements(prev => prev.map(text => 
                        text.id === selectedTextId 
                          ? { ...text, fontSize: newSize }
                          : text
                      ));
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      文字色
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      下地色
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      透明度
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div></div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        const newEnabled = !backgroundColorEnabled;
                        setBackgroundColorEnabled(newEnabled);
                        if (selectedTextId) {
                          setTextElements(prev => prev.map(text =>
                            text.id === selectedTextId
                              ? { ...text, backgroundColorEnabled: newEnabled }
                              : text
                          ));
                        }
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        backgroundColorEnabled
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {backgroundColorEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex justify-center text-xs text-gray-600">
                    {Math.round(fontColorOpacity * 100)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="color"
                      value={previewFontColor ?? fontColor}
                      onChange={e => {
                        const value = (e.target as HTMLInputElement).value;
                        setPreviewFontColor(value);
                        if (selectedTextId) {
                          setTextElements(prev => prev.map(text =>
                            text.id === selectedTextId
                              ? { ...text, fontColor: value }
                              : text
                          ));
                        }
                      }}
                      onBlur={e => {
                        const value = (e.target as HTMLInputElement).value;
                        setFontColor(value);
                        setPreviewFontColor(null);
                      }}
                      className="w-full h-8 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <input
                      type="color"
                      value={backgroundColorEnabled ? backgroundColor : '#ffffff'}
                      onChange={e => {
                        const value = (e.target as HTMLInputElement).value;
                        setBackgroundColor(value);
                        if (selectedTextId) {
                          setTextElements(prev => prev.map(text =>
                            text.id === selectedTextId
                              ? { ...text, backgroundColor: value }
                              : text
                          ));
                        }
                      }}
                      className="w-full h-8 border border-gray-300 rounded-md"
                      disabled={!backgroundColorEnabled}
                      style={{
                        opacity: backgroundColorEnabled ? 1 : 0.5,
                        cursor: backgroundColorEnabled ? 'pointer' : 'not-allowed'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={fontColorOpacity}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setFontColorOpacity(value);
                        setBackgroundColorOpacity(value);
                        if (selectedTextId) {
                          setTextElements(prev => prev.map(text =>
                            text.id === selectedTextId
                              ? { ...text, fontColorOpacity: value, backgroundColorOpacity: value }
                              : text
                          ));
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 選択中テキストの位置表示 */}
              {selectedTextId && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">X位置</label>
                      <input
                        type="number"
                        value={Math.round(textElements.find(t => t.id === selectedTextId)?.position.x || 0)}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (selectedTextId) {
                            setTextElements(prev => prev.map(text =>
                              text.id === selectedTextId
                                ? { ...text, position: { ...text.position, x: value } }
                                : text
                            ));
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Y位置</label>
                      <input
                        type="number"
                        value={Math.round(textElements.find(t => t.id === selectedTextId)?.position.y || 0)}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (selectedTextId) {
                            setTextElements(prev => prev.map(text =>
                              text.id === selectedTextId
                                ? { ...text, position: { ...text.position, y: value } }
                                : text
                            ));
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* X軸・Y軸配置スライダー */}
              <div className="space-y-3 mb-2">
                {/* X軸配置 */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    X軸配置: {['左', '中', '右'][Math.round((xAlignment ?? 0.5) * 2)]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.5"
                    value={xAlignment ?? 0.5}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setXAlignment(value);
                      updateTextPosition('x', value);
                    }}
                    className="flex-1"
                  />
                </div>
                
                {/* Y軸配置 */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    Y軸配置: {['上', '中', '下'][Math.round((yAlignment ?? 0.5) * 2)]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.5"
                    value={yAlignment ?? 0.5}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setYAlignment(value);
                      updateTextPosition('y', value);
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              <button
                onClick={resetAll}
                className="w-full bg-gray-500 text-white py-2 px-3 rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                すべてリセット
              </button>
            </div>
          </div>

          {/* 画像表示エリア（中央3カラム→3カラム） */}
          <div className="lg:col-span-3 flex">
            <div
              ref={containerRef}
              className={`relative bg-white rounded-lg shadow-md overflow-hidden flex-1 ${
                isDragging ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-dashed border-gray-300'
              }`}
              style={{ 
                width: '100%',
                height: 'calc(100vh - 2rem)',
                maxHeight: 'calc(100vh - 2rem)'
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {image ? (
                <>
                  {/* プレビューcanvasを表示（操作もcanvas上で） */}
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      zIndex: 1,
                      cursor: canvasDrag.dragging ? 'grabbing' : 'pointer',
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={canvasDrag.dragging ? handleCanvasMouseMove : undefined}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                  {/* 画像要素は非表示でcanvas描画用に保持 */}
                  <img
                    ref={imageRef}
                    src={image}
                    alt="アップロードされた画像"
                    style={{ display: 'none' }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-base">写真をここにドラッグ&ドロップしてください</p>
                    <p className="text-xs mt-1">または、ファイルをクリックして選択してください</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                              setImage(e.target?.result as string);
                              // 画像サイズに基づいてCanvasサイズを調整
                              if (containerRef.current) {
                                const container = containerRef.current;
                                const containerWidth = container.clientWidth;
                                const containerHeight = container.clientHeight;
                                
                                // アスペクト比を保持しながらサイズを調整
                                const imgAspectRatio = img.width / img.height;
                                const containerAspectRatio = containerWidth / containerHeight;
                                
                                if (imgAspectRatio > containerAspectRatio) {
                                  // 横長画像の場合
                                  container.style.width = `${containerWidth}px`;
                                  container.style.height = `${containerWidth / imgAspectRatio}px`;
                                } else {
                                  // 縦長画像の場合
                                  container.style.height = `${containerHeight}px`;
                                  container.style.width = `${containerHeight * imgAspectRatio}px`;
                                }
                              }
                            };
                            img.src = e.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-3 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フォント一覧＋サンプルパネル（右端2カラム） */}
          <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
            <div className="font-bold text-sm text-gray-700 mb-2">フォント</div>
            <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              {fonts.map(font => (
                <div key={font} className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">{font}</div>
                  <div
                    className={`px-2 py-1 rounded border shadow-sm text-sm text-gray-900 overflow-x-auto whitespace-nowrap cursor-pointer transition-colors ${
                      fontFamily === font 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: font }}
                    onClick={() => {
                      setFontFamily(font);
                      if (selectedTextId) {
                        setTextElements(prev => prev.map(text => 
                          text.id === selectedTextId 
                            ? { ...text, fontFamily: font }
                            : text
                        ));
                      }
                    }}
                  >
                    {(currentText || 'サンプル').replace(/\n/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
