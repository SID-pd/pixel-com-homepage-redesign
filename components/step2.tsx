import React, { useState, useEffect } from "react";
import { apiPost } from "../app/api/service/api-service";
import { toastError, toastSuccess } from "../app/api/service/common";
import { useRouter } from "next/navigation";

interface Step2Props {
    templateId: any,
    coverType: string;
    setCoverType: (type: string) => void;
    setStep: (step: number) => void;
    onDataChange: (data: any) => void; // callback to send form data to parent
}

const Step2: React.FC<Step2Props> = ({ templateId, coverType, setCoverType, setStep, onDataChange }) => {
    let [pages, setPages] = useState<any>(null);
    let [pageSize, setSize] = useState<any>(null);
    const [paper, setPaper] = useState("");
    const [tamplateImage, setTamplateImage] = useState("");
    const [paperCoverName, setPaperCoverName] = useState<any>({});
    const [paperSize, setPaperSize] = useState<any>({});
    const [paperQualitySelected, setPaperQualitySelected] = useState<any>({});
    const [pagesOptions, setPagesOptions] = useState<number[]>([]);
    const [pagesSizeOptions, setPagesSizeOptions] = useState<any[]>([]);
    const [pagesCoversOptions, setPagesCoversOptions] = useState<any[]>([]);
    const [pagesPaperQuality, setpagesPaperQuality] = useState<any[]>([]);
    const [cardSizeType, setcardSizeType] = useState<number>(0);
    const router = useRouter();
    let [minPage, setMinpage] = useState<any>(null);
    let [basePrice, setBasePrice] = useState<any>(null);
    const [marriageDetails, setMarriageDetails] = useState({ groomName: "", brideName: "", weddingDate: "", });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const formData = new FormData();
                formData.append("id", templateId);
                const response: any = await apiPost<any>("template/detail", formData);

                if (response.status) {
                    const step = 20;
                    const pagesOptions: number[] = [];
                    for (let i = response.data.min_page; i <= response.data.max_page; i += step) {
                        pagesOptions.push(i);
                    }
                    setcardSizeType(response.data.type)
                    setMinpage(response.data.min_page);
                    setBasePrice(response.data.base_price);
                    setPages(response.data.min_page);
                    setSize(response.data.sizes[0]._id);
                    setCoverType(response.data.covers[0]._id);
                    setPaper(response.data.papers[0]._id);
                    setPaperCoverName(response.data.covers[0])
                    setPaperSize(response.data.sizes[0])
                    setPaperQualitySelected(response.data.papers[0])
                    setTamplateImage(response.data.image_full_path)
                    setPagesOptions(Array.from(new Set(pagesOptions)));
                    setPagesSizeOptions(response.data.sizes);
                    setPagesCoversOptions(response.data.covers);
                    setpagesPaperQuality(response.data.papers)
                    //   setTemplateData(response.data);
                } else {
                    toastError(response.message);
                }
            } catch (error: any) {
                toastError(error.message || "Something went wrong");
            }
        };

        if (templateId) fetchData();
    }, [templateId]);

    const ChageCoverType = (e: any, type: any) => {
        setCoverType(e.target.value)
        setPaperCoverName(type)
    }

    const ChageSize = (e: any, type: any) => {
        setSize(e.target.value)
        setPaperSize(type)
    }

    const ChageQuality = (e: any) => {
        setPaper(e.target.value)
        let data = pagesPaperQuality.filter((item) => item._id == e.target.value);
        setPaperQualitySelected(data[0])
    }

    const goToNext = () => {
        // Merge onto step1's stored data instead of replacing it outright —
        // step1 sets fields (category, min_page, max_page) that this step
        // never recomputes but that order/store and element-editing still
        // require; overwriting wholesale silently dropped them and made
        // every order/store call 500 on json.loads(category).
        const previousData = JSON.parse(localStorage.getItem('customize_data') || '{}');
        let formdata = {
            ...previousData,
            templateId: templateId,
            card_size_type: cardSizeType,
            number_of_pages: pages,
            page_size: paperSize,
            cover_type: paperCoverName,
            paper_quality: paperQualitySelected,
            total_price: calculateTotalPrice('Total'),
            base_price: calculateTotalPrice('Base Total'),
            marriageDetails: marriageDetails
        }
        console.log("formdata", formdata);

        localStorage.setItem('customize_data', JSON.stringify(formdata))
        router.push("/photo-book?stepId=3");
        setStep(3);
    }

    const goToBack = () => {
        router.push("/photo-book?stepId=1");
        setStep(1);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMarriageDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const calculateTotalPrice = (type: any): string => {
        let price = 0;
        let base_price = 0;

        if (pageSize) {
            const selectedSize = pagesSizeOptions.find((s) => s._id === pageSize);
            if (selectedSize) price += selectedSize.price;
        }

        if (coverType) {
            const selectedCover = pagesCoversOptions.find((c) => c._id === coverType);
            if (selectedCover) price += selectedCover.price;
        }

        if (paper) {
            const selectedPaper = pagesPaperQuality.find((p) => p._id === paper);
            if (selectedPaper) price += selectedPaper.price;
        }

        if (pages && pages >= minPage) {
            const multiplier = pages / minPage;
            price += basePrice * multiplier;
            base_price += basePrice * multiplier;
        }
        if (type == "Total") {
            return price.toFixed(2);
        } else {
            return base_price.toFixed(2);
        }
    };

    return (
        <div className="p-book-step-customize step-2">
            <h3>Customize Your Photo Book</h3>
            <div className="row">
                <div className="col-lg-9 col-md-8">
                    <div className="customize-p-book-left">
                        <form>
                            {/* Pages */}
                            <div className="form-group">
                                <label>Number of Pages</label>
                                <select className="form-control" value={pages || ''} onChange={(e) => setPages(e.target.value)}>
                                    {pagesOptions.map((page) => (
                                        <option key={page} value={page}>
                                            {page} Pages
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Size Options */}
                            <div className="form-group">
                                <label>Size</label>
                                <div className="size-options">

                                    {pagesSizeOptions.map((size) => (
                                        <label key={size._id} className={`size-option  ${size._id === pageSize ? "selected" : ""}`}>
                                            <input
                                                type="radio"
                                                name="size"
                                                value={size._id}
                                                checked={size._id === pageSize}
                                                onChange={(e) => { ChageSize(e, size) }}
                                                hidden
                                            />
                                            <div className="size-option__name">{size.size_name}</div>
                                            <div className="size-option__price">${size.price}</div>
                                        </label>
                                    ))}
                                </div>
                            </div>


                            {/* Cover Options */}
                            <div className="form-group">
                                <label>Cover Type</label>
                                <div className="cover-options">
                                    {pagesCoversOptions.map((type) => (
                                        <label className={`cover-option ${coverType === type._id ? "selected" : ""}`} key={type._id}>
                                            <input
                                                type="radio"
                                                name="coverType"
                                                value={type._id}
                                                checked={coverType === type._id}
                                                onChange={(e) => ChageCoverType(e, type)}
                                            />
                                            <div className="cover-option__content">
                                                <div className="cover-option__name">{type.cover_name.charAt(0).toUpperCase() + type.cover_name.slice(1)}</div>
                                                <div className="cover-option__desc">
                                                    {type.desc}
                                                </div>
                                                <div className="cover-option__price">+${type.price}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Paper Quality */}
                            <div className="form-group">
                                <label>Paper Quality</label>
                                <select className="form-control" value={paper} onChange={(e) => { ChageQuality(e) }}>
                                    {pagesPaperQuality.map((page, index) => (
                                        <option key={page._id} value={page._id} disabled={index != 0 ? true : false}>
                                            {page.paper_name} (+${page.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {templateId == "68aecfe95ff717e1efb5daf0" && (
                                <>

                                    <div className="form-group">
                                        <label>Groom Name</label>
                                        <input
                                            type="text"
                                            name="groomName"
                                            value={marriageDetails.groomName}
                                            onChange={handleChange}
                                            placeholder="Groom Name"
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Bride Name</label>
                                        <input
                                            type="text"
                                            name="brideName"
                                            value={marriageDetails.brideName}
                                            onChange={handleChange}
                                            placeholder="Bride Name"
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Wedding Date</label>
                                        <input
                                            type="date"
                                            name="weddingDate"
                                            value={marriageDetails.weddingDate}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>

                <div className="col-lg-3 col-md-4">
                    <div className="customize-p-book-right text-center">
                        <h4>Preview</h4>
                        <img src={tamplateImage ? tamplateImage : `${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/Wedding.png`} alt="Preview" />
                        <span>{paperSize.size_name}</span>
                        <h5>{paperCoverName?.cover_name &&
                            paperCoverName.cover_name.charAt(0).toUpperCase() +
                            paperCoverName.cover_name.slice(1)}
                        </h5>
                        <div className="price">${calculateTotalPrice('Total')}</div>
                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-between">
                <button className="btn btn-secondary mt-4" onClick={() => goToBack()}>
                    Back
                </button>
                <button className="btn btn-secondary mt-4" onClick={() => goToNext()}>
                    Continue
                </button>
            </div>
        </div>
    );
};

export default Step2;
