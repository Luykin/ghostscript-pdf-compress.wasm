import { useState } from 'react';
import { Dropdown, DropdownMenu, DropdownToggle, DropdownItem, Badge } from 'reactstrap';

const compressionModes = [
  {
    id: "screen",
    label: "Screen",
    dpi: "72 DPI",
    description: "最低质量，最小文件体积，适合屏幕显示（网页、演示）",
    setting: "/screen",
    color: "info"
  },
  {
    id: "ebook",
    label: "eBook",
    dpi: "150 DPI", 
    description: "中等质量，兼顾清晰度和文件大小，适合电子书",
    setting: "/ebook",
    color: "primary"
  },
  {
    id: "printer",
    label: "Print",
    dpi: "300 DPI",
    description: "打印标准质量，图像清晰，适合普通打印输出",
    setting: "/printer",
    color: "success"
  },
  {
    id: "prepress",
    label: "Prepress",
    dpi: "300~400+ DPI",
    description: "高质量印刷输出，保留编辑信息，适合专业出版",
    setting: "/prepress",
    color: "warning"
  },
  {
    id: "none",
    label: "No Compression",
    dpi: "Original",
    description: "保持原始质量，不进行压缩",
    setting: null,
    color: "secondary"
  }
];

export function CompressionModeDropdown({ value, onChange, id = "compression-mode" }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggle = () => setDropdownOpen(prevState => !prevState);
  
  const selectedMode = compressionModes.find(mode => mode.id === value) || compressionModes[1];
  
  const handleSelect = (mode) => {
    onChange(mode.id);
    setDropdownOpen(false);
  };

  return (
    <div className="compression-dropdown-container">
      <Dropdown isOpen={dropdownOpen} toggle={toggle} className="compression-dropdown">
        <DropdownToggle 
          caret 
          className="compression-dropdown-toggle"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#646cff',
            fontSize: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '280px',
            textAlign: 'left'
          }}
        >
          <div className="selected-mode-display">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600' }}>{selectedMode.label}</span>
              <Badge color={selectedMode.color} style={{ fontSize: '12px' }}>
                {selectedMode.dpi}
              </Badge>
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {selectedMode.description}
            </div>
          </div>
        </DropdownToggle>
        <DropdownMenu 
          className="compression-dropdown-menu"
          style={{
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '320px'
          }}
        >
          {compressionModes.map((mode) => (
            <DropdownItem
              key={mode.id}
              onClick={() => handleSelect(mode)}
              className={`compression-dropdown-item ${value === mode.id ? 'active' : ''}`}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                margin: '2px 0',
                cursor: 'pointer',
                backgroundColor: value === mode.id ? 'rgba(100, 108, 255, 0.1)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#333' }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {mode.description}
                  </div>
                </div>
                <Badge color={mode.color} style={{ fontSize: '11px', marginLeft: '12px' }}>
                  {mode.dpi}
                </Badge>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export { compressionModes };