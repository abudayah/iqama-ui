interface ConfirmationSheetProps {
  consequenceText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationSheet({
  consequenceText,
  onConfirm,
  onCancel,
}: ConfirmationSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
        data-testid="confirmation-backdrop"
      />

      {/* Bottom-sheet panel */}
      <div
        className="relative bg-white rounded-t-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Consequence text */}
        <p className="text-sm text-gray-700 mb-6">{consequenceText}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded py-3 text-sm font-medium transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded py-3 text-sm font-medium transition-colors min-h-[44px]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
