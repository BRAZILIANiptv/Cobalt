import React from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ReactComponent as DockSVG } from "../assets/dock-to-left-filled.svg";
import HomeIcon from '@mui/icons-material/Home';
import { BareClient } from "@tomphttp/bare-client";
import { bareServerURL } from "../consts.jsx";
import Obfuscate from "../components/obfuscate.jsx"
import Head from "../components/head.jsx"

function Home() {
    const bare = React.useMemo(() => new BareClient(bareServerURL), []);

    const web = React.useRef();
    const search = React.useRef();
    const [ lastURL, setLastURL] = React.useState("");
    const [ homeURL, setHomeURL ] = React.useState("cobalt://home");
    const [ loading, setLoading] = React.useState(false);
    const internalURLS = ["home"];
    const [ canGoBack, setCanGoBack] = React.useState(false);
    const [ canGoForward, setCanGoForward] = React.useState(false);
    const [ suggestions, setSuggestions ] = React.useState([]);
    const [ searchEngine, setSearchEngine ] = React.useState("https://www.google.com/search?q=%s");
    const [ useSuggestions, setUseSuggestions ] = React.useState(true);
    const [ currentURL, setCurrentURL ] = React.useState(homeURL);

    React.useEffect(() => {
        searchURL(homeURL)
    }, [])

    React.useEffect(() => {
        if (!useSuggestions) {
            setSuggestions([]);
        }
    }, [useSuggestions]);

    const searchEngineURL = (query) => {
        return searchEngine.replace("%s", query)
    }

    const reloadPage = () => {
        setLoading(true)

        web.current.contentWindow.location.reload();
    }

    const historyBack = () => {
        if (canGoBack) {
            setLoading(true)

            web.current.contentWindow.history.back();
        }
    }

    const historyForward = () => {
        if (canGoForward) {
            setLoading(true)

            web.current.contentWindow.history.forward();
        }
    }

    const stopLoadingPage = () => {
        setLoading(false)

        web.current.contentWindow.stop();
    }

    const webLoad = () => {
        setLoading(false)
        
        var webChange = function () {
            setTimeout(function () {
                setCanGoBack(web.current.contentWindow.navigation.canGoBack)
                setCanGoForward(web.current.contentWindow.navigation.canGoForward)

                if (web.current.contentWindow.location.pathname.startsWith(__uv$config.prefix)) {
                    var url = __uv$config.decodeUrl(web.current.contentWindow.location.pathname.split(__uv$config.prefix)[1])
                } else if (web.current.contentWindow.location.pathname.startsWith("/internal/")) {
                    var url = "cobalt://" + web.current.contentWindow.location.pathname.split("/internal/")[1]
                } else {
                    var url = web.current.contentWindow.location.toString()
                }

                if (url !== lastURL) {
                    search.current.value = url
                    setCurrentURL(url)
                    setLastURL(url)
                }
            })
        }
        
        web.current.contentWindow.removeEventListener("unload", webChange)
        web.current.contentWindow.addEventListener("unload", webChange)
        webChange()
    }

    function isURL(url) {
        if (!url.includes(".")) {
            return false;
        }

        try {
            var valid = new URL(url)
    
            return valid.toString();
        } catch {
            try {
                var valid = new URL("https://" + url)
    
                return valid.toString();
            } catch {
                return false;
            }
        }
    }

    const searchURL = (value) => {
        value = value.trim()

        setLoading(true)

        if (value.startsWith("cobalt://") && internalURLS.includes(value.split("cobalt://")[1])) {
            search.current.value = value
            web.current.contentWindow.location = new URL("/internal/" + value.split("cobalt://")[1], window.location)
            setCurrentURL(value)
        } else {
            var checkURL = isURL(value)

            if (checkURL) {
                search.current.value = checkURL
                web.current.contentWindow.location = new URL(__uv$config.prefix + __uv$config.encodeUrl(checkURL), window.location)
                setCurrentURL(checkURL)
            } else {
                search.current.value = new URL(searchEngineURL(encodeURIComponent(value)).toString()).toString()
                web.current.contentWindow.location = new URL(__uv$config.prefix + __uv$config.encodeUrl(search.current.value), window.location)
                setCurrentURL(new URL(searchEngineURL(encodeURIComponent(value)).toString()).toString())
            }
        }

        search.current.blur()
        web.current.focus()
    }

    const togglePanel = () => {
        if (!document.body.dataset.panel) {
            return document.body.dataset.panel = "true"
        } else if (document.body.dataset.panel == "true") {
            return document.body.dataset.panel = "false"
        } else if (document.body.dataset.panel == "false") {
            return document.body.dataset.panel = "true"
        }
    }

    const searchFocus = (e) => {
        e.target.select()
    }

    const searchType = (e) =>{
        if (e.key == "Enter") {
            return searchURL(e.target.value)
        }
    }

    const getSuggestions = async (query, limit=8) => {
        var site = await bare.fetch(
            "https://www.google.com/complete/search?client=firefox&q=" + query
        );
        var results = await site.json();
        results = results[1];
        results = results.slice(0, limit)
        return results;
    }

    const searchChange = async (e) => {
        if (e.target.value && useSuggestions) {
            try {
                var newSuggestions = await getSuggestions(e.target.value)
                setSuggestions(newSuggestions)
            } catch {
                setSuggestions([])
            }
        } else {
            setSuggestions([])
        }
    }

    const searchBlur = () => {
        setTimeout(() => {
            setSuggestions([])
        }, 100)
    }

    if (!window.Cobalt) {
        window.Cobalt = {
            "url": currentURL,
            "navigate": searchURL,
            "reload": reloadPage,
            "back": historyBack,
            "forward": historyForward,
            "togglePanel": togglePanel,
            "homeURL": homeURL,
            "loading": loading,
            "canGoBack": canGoBack,
            "canGoForward": canGoForward,
            "useSuggestions": useSuggestions,
            "searchEngine": searchEngine,
            "getSuggestions": getSuggestions
        }
    }

    React.useEffect(() => {
        window.Cobalt.homeURL = homeURL
    }, [homeURL])

    React.useEffect(() => {
        window.Cobalt.loading = loading
    }, [loading])

    React.useEffect(() => {
        window.Cobalt.canGoBack = canGoBack
    }, [canGoBack])

    React.useEffect(() => {
        window.Cobalt.canGoForward = canGoForward
    }, [canGoForward])

    React.useEffect(() => {
        window.Cobalt.useSuggestions = useSuggestions
    }, [useSuggestions])

    React.useEffect(() => {
        window.Cobalt.searchEngine = searchEngine
    }, [searchEngine])

    React.useEffect(() => {
        window.Cobalt.url = currentURL
    }, [currentURL])

    return (
        <>
            <Head />
            <div className="nav">
                <div className="controls" data-side="left">
                    <div className="controlsButton" onClick={historyBack} data-disabled={canGoBack ? "false": "true"}>
                        <ArrowBackIcon fontSize="small" />
                    </div>
                    <div className="controlsButton" onClick={historyForward} data-disabled={canGoForward ? "false": "true"}>
                        <ArrowForwardIcon fontSize="small" />
                    </div>
                    { !loading ? (
                        <div className="controlsButton" onClick={reloadPage}>
                            <RefreshIcon fontSize="small" />
                        </div>
                    ) : (
                        <div className="controlsButton" onClick={stopLoadingPage}>
                            <CloseIcon fontSize="small" />
                        </div>
                    )
                    }
                    <div className="controlsButton" onClick={() => searchURL(homeURL)}>
                        <HomeIcon fontSize="small" />
                    </div>
                </div>
                <div className="omnibox" data-suggestions={suggestions.length > 0 ? "true" : "false"}>
                    <input ref={search} defaultValue={homeURL} onFocus={searchFocus} onBlur={searchBlur} autoComplete="off" className="search" onKeyUp={searchType} onChange={searchChange} />
                    <div className="suggestions">
                        {suggestions.map((suggestion, index) => (
                            <div className="suggestion" onClick={() => {searchURL(suggestion); setSuggestions([])}} key={index}>
                                <div className="suggestionIcon">
                                    <SearchIcon style={{"height": "0.7em", "width": "0.7em"}} />
                                </div>
                                <Obfuscate>{suggestion}</Obfuscate>
                            </div>
                        ))}
                    </div>
                    <div className="searchIcon">
                        <SearchIcon style={{"height": "70%", "width": "70%"}} />
                    </div>
                </div>
                <div className="controls" data-side="right">
                    <div className="controlsButton" onClick={() => togglePanel()}>
                        <DockSVG style={{"height": "70%", "width": "70%"}} />
                    </div>
                </div>
            </div>
            <iframe ref={web} onLoad={webLoad} className="web"></iframe>
            <div className="panel">
                <div className="sidePanel">
                    <div className="sidePanelNav">
                        <div className="sidePanelItem">
                            <div className="sidePanelItemTitle">Favorites</div>
                            <div className="sidePanelItemIcon">
                                <ArrowDropDownIcon fontSize="small" />
                            </div>
                        </div>
                    </div>
                    <div className="sidePanelBody">

                    </div>
                </div>
            </div>
        </>
    )
}

export default Home;