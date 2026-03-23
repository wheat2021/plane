import { useState, useRef, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import type { FC } from "react";
import { Link2, Pencil, Plus, X } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import type { TExtraPropertyConfig, TExtraPropertyValue, TReferenceItem } from "@plane/types";
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";

interface IReferenceControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: TReferenceItem[] | null) => void;
  disabled?: boolean;
}

/** Parse value into TReferenceItem[] safely */
function parseLinks(value: TExtraPropertyValue): TReferenceItem[] {
  if (!value || !Array.isArray(value) || value.length === 0) return [];
  if (typeof value[0] === "object" && value[0] !== null) return value as TReferenceItem[];
  return [];
}

interface LinkFormState {
  display: string;
  url: string;
  displayError: string;
}

const emptyForm = (): LinkFormState => ({ display: "", url: "", displayError: "" });

export const ReferenceControl: FC<IReferenceControl> = (props) => {
  const { config, value, onChange, disabled = false } = props;

  const links = parseLinks(value);

  // Popover positioning
  const [referenceEl, setReferenceEl] = useState<HTMLButtonElement | null>(null);
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceEl, popperEl, {
    placement: "bottom-end",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 8 } },
      { name: "flip", options: { padding: 8 } },
    ],
  });

  // Editing state: index of item being edited (-1 = none)
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editForm, setEditForm] = useState<LinkFormState>(emptyForm());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addForm, setAddForm] = useState<LinkFormState>(emptyForm());

  const editDisplayRef = useRef<HTMLInputElement>(null);
  const addDisplayRef = useRef<HTMLInputElement>(null);

  // Focus edit input when editingIndex changes
  useEffect(() => {
    if (editingIndex >= 0) {
      editDisplayRef.current?.focus();
    }
  }, [editingIndex]);

  // Focus add input when isAddingNew becomes true
  useEffect(() => {
    if (isAddingNew) {
      addDisplayRef.current?.focus();
    }
  }, [isAddingNew]);

  const startEdit = (index: number) => {
    setIsAddingNew(false);
    setEditingIndex(index);
    setEditForm({ display: links[index].display, url: links[index].url, displayError: "" });
  };

  const cancelEdit = () => {
    setEditingIndex(-1);
    setEditForm(emptyForm());
  };

  const saveEdit = () => {
    if (!editForm.display.trim()) {
      setEditForm((f) => ({ ...f, displayError: "显示名称不能为空" }));
      return;
    }
    const updated = links.map((l, i) =>
      i === editingIndex ? { display: editForm.display.trim(), url: editForm.url.trim() } : l
    );
    onChange(updated.length > 0 ? updated : null);
    setEditingIndex(-1);
    setEditForm(emptyForm());
  };

  const deleteLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : null);
    if (editingIndex === index) {
      setEditingIndex(-1);
      setEditForm(emptyForm());
    }
  };

  const startAdd = () => {
    setEditingIndex(-1);
    setEditForm(emptyForm());
    setIsAddingNew(true);
    setAddForm(emptyForm());
  };

  const cancelAdd = () => {
    setIsAddingNew(false);
    setAddForm(emptyForm());
  };

  const saveAdd = () => {
    if (!addForm.display.trim()) {
      setAddForm((f) => ({ ...f, displayError: "显示名称不能为空" }));
      return;
    }
    const updated = [...links, { display: addForm.display.trim(), url: addForm.url.trim() }];
    onChange(updated);
    setIsAddingNew(false);
    setAddForm(emptyForm());
  };

  // Read-only inline display (comma-separated links)
  const renderLinks = () => {
    if (links.length === 0) {
      return <span className="text-body-xs-regular text-placeholder">—</span>;
    }
    return (
      <span className="text-body-xs-regular flex flex-wrap gap-x-1">
        {links.map((link, i) => (
          <span key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 font-medium hover:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {link.display}
            </a>
            {i < links.length - 1 && <span className="text-tertiary">,</span>}
          </span>
        ))}
      </span>
    );
  };

  if (disabled) {
    return <div className="h-7.5 flex items-center">{renderLinks()}</div>;
  }

  return (
    <Popover className="relative w-full">
      {({ open }) => (
        <>
          <Popover.Button
            ref={setReferenceEl}
            className={cn(
              "w-full h-7.5 flex items-center text-left px-2 rounded border border-transparent",
              "hover:border-tertiary focus:border-primary focus:outline-none",
              open && "border-primary"
            )}
          >
            {renderLinks()}
          </Popover.Button>

          {createPortal(
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                ref={setPopperEl}
                style={styles.popper}
                {...attributes.popper}
                className="z-30 w-80 rounded-md border border-strong bg-layer-2 shadow-lg"
                // Prevent clicks inside the portal panel from bubbling to
                // the sidebar's click-outside handler and closing the sidebar
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-strong">
                  <span className="text-body-xs-medium text-primary flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                {/* Link list */}
                <div className="max-h-60 overflow-y-auto">
                  {links.length === 0 && !isAddingNew && (
                    <p className="text-body-xs-regular text-tertiary px-3 py-3">暂无链接</p>
                  )}
                  {links.map((link, index) => (
                    <div key={index} className="border-b border-strong last:border-b-0">
                      {editingIndex === index ? (
                        /* Editing row */
                        <div className="px-3 py-2 space-y-1.5">
                          <div>
                            <input
                              ref={editDisplayRef}
                              type="text"
                              value={editForm.display}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, display: e.target.value, displayError: "" }))
                              }
                              placeholder="显示名称"
                              className={cn(
                                "w-full text-body-xs-regular bg-layer-1 border rounded px-2 py-1 focus:outline-none",
                                editForm.displayError ? "border-red-500" : "border-strong focus:border-primary"
                              )}
                            />
                            {editForm.displayError && (
                              <p className="text-caption-xs-regular text-red-500 mt-0.5">{editForm.displayError}</p>
                            )}
                          </div>
                          <input
                            type="text"
                            value={editForm.url}
                            onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                            placeholder="URL"
                            className="w-full text-body-xs-regular bg-layer-1 border border-strong rounded px-2 py-1 focus:outline-none focus:border-primary"
                          />
                          <div className="flex justify-end gap-2 pt-0.5">
                            <Button variant="neutral-primary" size="sm" onClick={cancelEdit}>
                              取消
                            </Button>
                            <Button variant="primary" size="sm" onClick={saveEdit}>
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Viewing row */
                        <div className="flex items-center gap-2 px-3 py-2 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-body-xs-medium text-primary truncate">{link.display}</p>
                            <p className="text-caption-xs-regular text-tertiary truncate">{link.url || "—"}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(index)}
                              className="p-1 rounded hover:bg-layer-1 text-secondary hover:text-primary"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLink(index)}
                              className="p-1 rounded hover:bg-layer-1 text-secondary hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New link form */}
                  {isAddingNew && (
                    <div className="px-3 py-2 space-y-1.5 border-t border-strong">
                      <div>
                        <input
                          ref={addDisplayRef}
                          type="text"
                          value={addForm.display}
                          onChange={(e) => setAddForm((f) => ({ ...f, display: e.target.value, displayError: "" }))}
                          placeholder="显示名称"
                          className={cn(
                            "w-full text-body-xs-regular bg-layer-1 border rounded px-2 py-1 focus:outline-none",
                            addForm.displayError ? "border-red-500" : "border-strong focus:border-primary"
                          )}
                        />
                        {addForm.displayError && (
                          <p className="text-caption-xs-regular text-red-500 mt-0.5">{addForm.displayError}</p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={addForm.url}
                        onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="URL"
                        className="w-full text-body-xs-regular bg-layer-1 border border-strong rounded px-2 py-1 focus:outline-none focus:border-primary"
                      />
                      <div className="flex justify-end gap-2 pt-0.5">
                        <Button variant="neutral-primary" size="sm" onClick={cancelAdd}>
                          取消
                        </Button>
                        <Button variant="primary" size="sm" onClick={saveAdd}>
                          保存
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Add link button */}
                {!isAddingNew && (
                  <div className="border-t border-strong px-3 py-2">
                    <button
                      type="button"
                      onClick={startAdd}
                      className="flex items-center gap-1.5 text-body-xs-regular text-secondary hover:text-primary w-full"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      添加链接
                    </button>
                  </div>
                )}
              </Popover.Panel>
            </Transition>,
            document.body
          )}
        </>
      )}
    </Popover>
  );
};
