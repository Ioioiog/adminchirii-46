
import { FormData } from "@/types/contract";

interface ContractAssetsProps {
  formData: FormData;
}

export function ContractAssets({ formData }: ContractAssetsProps) {
  return (
    <>
      <h2 className="text-xl font-bold mt-8 mb-4">ANEXA 1 - INVENTARUL BUNURILOR</h2>
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Denumire bun</th>
              <th className="border p-2 text-left">Valoare (lei)</th>
              <th className="border p-2 text-left">Stare</th>
            </tr>
          </thead>
          <tbody>
            {(formData.assets || []).map((asset, index) => (
              <tr key={index}>
                <td className="border p-2">{asset.name}</td>
                <td className="border p-2">{asset.value}</td>
                <td className="border p-2">{asset.condition}</td>
              </tr>
            ))}
            {!(formData.assets || []).length && (
              <tr>
                <td className="border p-2">_____</td>
                <td className="border p-2">_____</td>
                <td className="border p-2">_____</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
