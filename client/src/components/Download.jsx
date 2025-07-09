import { useQuery } from "@tanstack/react-query";
import { Companies } from "../api/companies";

export default function Download({companyId, companySymbol}) {
    const { data, isLoading, error, refetch} = useQuery({
        queryKey: ['download', companyId, companySymbol],
        queryFn: async () => {
                const response = await Companies.downloadCompanyData(companyId, companySymbol);
                if (response && response.data) {
                    return response.data;
                } else if (response) {
                    return response;
                } else {
                    return null;
                }
        },
        retry: false,
        enabled: false
    })

    function handleDownload() {
        refetch().then((result) => {
            if (result.data && result.data !== null) {
                    const jsonString = JSON.stringify(result.data, null, 2);
                    const file = new Blob([jsonString], { type: 'application/json' });
                    const element = document.createElement("a");
                    element.href = URL.createObjectURL(file);
                    element.download = `${companySymbol}_data.json`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    URL.revokeObjectURL(element.href);
            }
        })
    }

    return (
        <button onClick={handleDownload} disabled={isLoading}>
            {isLoading ? 'Downloading...' : 'Download Company Data'}
        </button>
    );

}
