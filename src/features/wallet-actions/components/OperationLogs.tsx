'use client'

interface OperationLogsProps {
  logs: string[]
}

export default function OperationLogs({ logs }: OperationLogsProps) {
  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
      <h3 className="text-lg font-semibold text-white mb-3">Operation Logs</h3>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">No operations yet. Select an action to see logs.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
