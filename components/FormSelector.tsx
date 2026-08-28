import React from "react";
import { useGame } from "../context/GameContext";
import { CASTING_FORMS } from "../gameData/core/castingForms";

export const FormSelector: React.FC = () => {
  const { state, selectForm } = useGame();

  const axes: Array<"method" | "duration" | "target"> = ["method", "duration", "target"];

  const hasAnyUnlockedBeyondInstant = Object.entries(state.castingFormsUnlocked).some(
    ([id, unlocked]) => unlocked && !id.endsWith("_instant") && !id.endsWith("outward")
  );

  // Always render after forms_awakened, but keep visible hint earlier
  const formsAwakened = state.flags["forms_awakened"] || hasAnyUnlockedBeyondInstant;

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-2 mb-3 flex flex-wrap gap-3 items-center text-xs">
      <span className="font-bold text-gray-600 uppercase tracking-wide mr-1">Casting Forms:</span>
      {axes.map((axis) => {
        const options = CASTING_FORMS.filter((f) => f.axis === axis);
        const current = state.activeFormSelection[axis];
        return (
          <label key={axis} className="flex items-center gap-1">
            <span className="text-gray-500 capitalize w-14">{axis}</span>
            <select
              value={current ?? ""}
              onChange={(e) => selectForm(axis, e.target.value || null)}
              className="bg-white border border-gray-300 rounded px-1 py-0.5 text-xs min-w-[110px] disabled:bg-gray-100 disabled:text-gray-400"
              disabled={!formsAwakened && axis !== "method"}
            >
              {options.map((f) => {
                const unlocked = state.castingFormsUnlocked[f.id];
                return (
                  <option key={f.id} value={f.id} disabled={!unlocked}>
                    {f.displayName} {!unlocked ? "🔒" : ""}
                  </option>
                );
              })}
            </select>
          </label>
        );
      })}
      {!formsAwakened && (
        <span className="text-[10px] text-gray-400 italic ml-2">Unlock via Awaken Casting Forms (Chapter IV)</span>
      )}
    </div>
  );
};
