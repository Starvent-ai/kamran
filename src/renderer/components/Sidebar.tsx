import type { StarventPlugin } from "@/plugins/pluginRegistry";
import logo from "@/assets/icon.png";

interface SidebarProps {
  activeId: string;
  plugins: StarventPlugin[];
  onSelect: (id: string) => void;
}

const FALLBACK_GROUP = "سایر";

export function Sidebar({ activeId, plugins, onSelect }: SidebarProps): JSX.Element {

  // Group while preserving each plugin's own `order` — the plugin list is
  // already order-sorted, so the first time a group name is seen fixes
  // that group's position too. No module needs to know about any other
  // module to be grouped correctly.
  const groups: { name: string; plugins: typeof plugins }[] = [];
  for (const plugin of plugins) {
    const groupName = plugin.group ?? FALLBACK_GROUP;
    let group = groups.find((g) => g.name === groupName);
    if (!group) {
      group = { name: groupName, plugins: [] };
      groups.push(group);
    }
    group.plugins.push(plugin);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={logo} alt="Starvent" />
        <span className="sidebar__brand-name">Starvent</span>
      </div>
      <nav className="sidebar__nav">
        {groups.map((group) => (
          <div key={group.name} className="sidebar__group">
            <span className="sidebar__group-label">{group.name}</span>
            {group.plugins.map((plugin) => (
              <button
                key={plugin.id}
                type="button"
                className="sidebar__link"
                data-active={plugin.id === activeId}
                onClick={() => onSelect(plugin.id)}
              >
                <span className="sidebar__icon" aria-hidden="true">
                  {plugin.icon}
                </span>
                <span>{plugin.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Fixed brand signature — always visible at the bottom of the
          sidebar, on every module/page, never scrolls away. */}
      <div className="sidebar__footer">
        <span className="sidebar__footer-line" aria-hidden="true" />
        <span className="sidebar__footer-text">از یک ایده تا یک محصول جهانی؛ Starvent شریک خلق فناوری‌های آینده است</span>
      </div>
    </aside>
  );
}
