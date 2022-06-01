import { Combobox } from "@headlessui/react";
import { ChevronRightIcon, SearchIcon } from "@heroicons/react/solid";
import { AdapterReturnType, ADTAdapterTwinsData, useAdapter } from "@microsoft/iot-cardboard-js";
import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "../App";

export const NavSearch: React.FC<any> = () => {
    const [searchString, setSearchString] = useState('');
    const [searchResults, setSearchResults] = useState<Array<any>>([]);
    const { ADT3DSceneAdapter } = useContext(ApplicationContext);

    const searchDataState = useAdapter({
        adapterMethod: (params: any): AdapterReturnType<ADTAdapterTwinsData> => {
            console.log(params);
            return ADT3DSceneAdapter.searchADTTwins({
                searchTerm: params.queryString,
                shouldSearchByModel: true
            })
        },
        refetchDependencies: [],
        isAdapterCalledOnMount: false
    });

    const onSearch = async (newVal?: string) => {
        clearSearchResults();
        setSearchString(newVal ?? "");
        const targetString = newVal ? newVal : searchString;
        if (targetString.length > 0) {
            searchDataState.callAdapter({ queryString: targetString });
        }
    };


    useEffect(() => {
        const newData = searchDataState.adapterResult.result?.data?.value ?? [];
        if (newData) {
            setSearchResults(newData);
        }
    }, [searchDataState.adapterResult, searchDataState.adapterResult.result]);



    const clearSearchResults = () => {
        searchDataState.cancelAdapter();
        setSearchResults([]);
    };


    return (
        <div className="mx-auto max-w-3xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all opacity-100 scale-100">
            <label htmlFor="search" className="sr-only">
                Search
            </label>
            <Combobox value={searchString} onChange={(e) => { onSearch(e) }} >
                {() => (
                    <>
                        <div className="relative">
                            <SearchIcon
                                className="pointer-events-none absolute mt-3 ml-3 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                            <Combobox.Input
                                id="search"
                                name="search"
                                className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading- focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                                placeholder="Search"
                                onChange={(e) => { onSearch(e.target.value) }}
                                value={searchString}
                                type="search"
                            />
                        </div>

                        {(searchString === '' || searchResults.length > 0) && (
                            <Combobox.Options as="div" static hold className="flex divide-x divide-gray-100 relative">

                                <div className="-mx-2 text-sm text-gray-700">
                                    {searchResults.map((twin) => (
                                        <Combobox.Option
                                            as="div"
                                            key={twin.$dtId}
                                            value={twin}
                                            className={({ active }) => `flex cursor-default select-none items-center rounded-md p-2 ${active ? 'bg-gray-100 text-gray-900' : ''}`}
                                        >
                                            {({ active }) => (
                                                <>
                                                    <img src={""} alt="" className="h-6 w-6 flex-none rounded-full" />
                                                    <span className="ml-3 flex-auto truncate">{twin.$dtId}</span>
                                                    {active && (
                                                        <ChevronRightIcon
                                                            className="ml-3 h-5 w-5 flex-none text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    ))}
                                </div>


                            </Combobox.Options>
                        )}
                    </>
                )}


            </Combobox>
        </div>);
}
