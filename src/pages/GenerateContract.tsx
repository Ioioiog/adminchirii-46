import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/layout/PageLayout";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types/json";
import jsPDF from 'jspdf';

interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  content: Json;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Asset {
  name: string;
  value: number;
  condition: string;
}

export default function GenerateContract() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [contractType, setContractType] = useState<string>("lease");
  const [validFrom, setValidFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [validUntil, setValidUntil] = useState<string>("");
  const [contractNumber, setContractNumber] = useState<string>(`1/${format(new Date(), "dd.MM.yyyy")}`);
  const [ownerDetails, setOwnerDetails] = useState({
    name: "",
    reg: "",
    fiscal: "",
    address: "",
    county: "",
    city: "",
    bank: "",
    bankName: "",
    representative: "",
    email: "",
    phone: ""
  });
  const [tenantDetails, setTenantDetails] = useState({
    name: "",
    reg: "",
    fiscal: "",
    address: "",
    county: "",
    city: "",
    bank: "",
    bankName: "",
    representative: "",
    email: "",
    phone: ""
  });
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    rooms: 2,
    rentAmount: 0,
    vatIncluded: "no",
    paymentDay: 1,
    lateFee: 0.1,
    contractDuration: 12,
    autoRenewal: "yes",
    renewalPeriod: 12,
    unilateralNotice: 90,
    terminationNotice: 30,
    earlyTerminationFee: "contravaloarea unei chirii lunare",
    latePaymentTermination: 40,
    securityDeposit: "contravaloarea unei chirii lunare",
    depositReturnPeriod: 3
  });
  const [utilities, setUtilities] = useState({
    waterCold: "",
    waterHot: "",
    electricity: "",
    gas: ""
  });
  const [assets, setAssets] = useState<Array<{ name: string; value: number; condition: string }>>([
    { name: "", value: 0, condition: "" }
  ]);

  // Add new signature-related state
  const [ownerSignatureDate, setOwnerSignatureDate] = useState(format(new Date(), "dd.MM.yyyy"));
  const [ownerSignatureName, setOwnerSignatureName] = useState("");
  const [tenantSignatureDate, setTenantSignatureDate] = useState(format(new Date(), "dd.MM.yyyy"));
  const [tenantSignatureName, setTenantSignatureName] = useState("");

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["contractTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, address");

      if (error) throw error;
      return data as Property[];
    },
  });

  const addAssetRow = () => {
    setAssets([...assets, { name: "", value: 0, condition: "" }]);
  };

  const removeAssetRow = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index);
    setAssets(newAssets);
  };

  const updateAsset = (index: number, field: keyof Asset, value: string | number) => {
    const newAssets = [...assets];
    newAssets[index] = {
      ...newAssets[index],
      [field]: value
    };
    setAssets(newAssets);
  };

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    const isEmpty = (value: any) => {
      if (typeof value === 'number') return false;
      if (typeof value === 'string') return !value.trim();
      return !value;
    };

    if (isEmpty(contractNumber)) newErrors.contractNumber = true;
    if (isEmpty(validFrom)) newErrors.validFrom = true;

    if (isEmpty(ownerDetails.name)) newErrors.ownerName = true;
    if (isEmpty(ownerDetails.fiscal)) newErrors.ownerFiscal = true;
    if (isEmpty(ownerDetails.address)) newErrors.ownerAddress = true;

    if (isEmpty(tenantDetails.name)) newErrors.tenantName = true;
    if (isEmpty(tenantDetails.fiscal)) newErrors.tenantFiscal = true;
    if (isEmpty(tenantDetails.address)) newErrors.tenantAddress = true;

    if (isEmpty(propertyDetails.address)) newErrors.propertyAddress = true;
    if (isEmpty(propertyDetails.rentAmount)) newErrors.rentAmount = true;

    if (isEmpty(selectedTemplate)) newErrors.selectedTemplate = true;
    if (isEmpty(selectedProperty)) newErrors.selectedProperty = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateContractPDF = () => {
    let assetsList = assets.map(asset => `
      <tr>
        <td>${asset.name}</td>
        <td>${asset.value}</td>
        <td>${asset.condition}</td>
      </tr>
    `).join('');

    if (!assetsList) {
      assetsList = `
        <tr>
          <td colspan="3" style="text-align: center;">Nu există bunuri înregistrate</td>
        </tr>`;
    }

    const contractDate = format(new Date(), 'dd.MM.yyyy');
    const contractContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; }
          </style>
        </head>
        <body>
          <h1>CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
          <p>Nr. ${contractNumber}</p>
          
          <h2>Părțile,</h2>
          
          <p>${ownerDetails.name}, Nr. ordine Reg. com./an: ${ownerDetails.reg}, Cod fiscal (C.U.I.): ${ownerDetails.fiscal}, cu sediul in ${ownerDetails.address}, Judetul: ${ownerDetails.county}, Localitatea: ${ownerDetails.city}, cont bancar ${ownerDetails.bank}, deschis la ${ownerDetails.bankName}, reprezentat: ${ownerDetails.representative}, e-mail: ${ownerDetails.email}, telefon: ${ownerDetails.phone} în calitate de Proprietar,</p>
          
          <p>${tenantDetails.name}, Nr. ordine Reg. com./an: ${tenantDetails.reg}, Cod fiscal (C.U.I.): ${tenantDetails.fiscal} cu domiciliul în ${tenantDetails.address}, Judetul: ${tenantDetails.county}, Localitatea: ${tenantDetails.city}, cont bancar ${tenantDetails.bank}, deschis la ${tenantDetails.bankName}, reprezentat: ${tenantDetails.representative}, e-mail: ${tenantDetails.email}, telefon: ${tenantDetails.phone}, în calitate de Chiriaș,</p>
          
          <h2>1. OBIECTUL CONTRACTULUI</h2>
          <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${propertyDetails.address}, compus din ${propertyDetails.rooms} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul incepand cu data de ${validFrom} ca locuință pentru familia sa.</p>
          
          <h2>2. PREȚUL CONTRACTULUI</h2>
          <p>2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${propertyDetails.rentAmount} euro ${propertyDetails.vatIncluded === 'no' ? '+ TVA' : 'TVA inclus'}. Plata chiriei se realizează în ziua de ${propertyDetails.paymentDay} a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului, indicat în preambulul prezentului contract. Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.</p>
          <p>2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează zilei de ${propertyDetails.paymentDay}.</p>
          <p>2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de ${propertyDetails.lateFee}% pentru fiecare zi de întârziere.</p>
          <p>2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.</p>
          <p>2.5. Părțile convin că, la expirarea perioadei inițiale de ${propertyDetails.contractDuration} luni, Proprietarul are dreptul de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua valoare propusă a chiriei.</p>
          <p>2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT (Statistical Office of the European Communities), calculat pentru anul precedent. Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data de aplicare, aceasta devenind efectivă de la 1 ianuarie al fiecărui an.</p>
          <p>2.7. Dacă Chiriașul acceptă ajustarea, contractul se prelungește automat în noile condiții. Dacă Chiriașul nu este de acord, contractul încetează de drept la expirarea perioadei inițiale de ${propertyDetails.contractDuration} luni, fără penalități pentru niciuna dintre părți.</p>
          
          <h2>3. DURATA CONTRACTULUI</h2>
          <p>3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de ${propertyDetails.contractDuration} luni. Părțile convin că perioada inițială minimă este de esența contractului.</p>
          <p>3.2. Părțile convin că la expirarea perioadei inițiale minime, operează tacita relocațiune, adică prelungirea automată a perioadei contractuale, cu perioade succesive de câte ${propertyDetails.renewalPeriod} luni.</p>
          
          <h2>4. ÎNCETAREA CONTRACTULUI</h2>
          <p>4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de ${propertyDetails.unilateralNotice} de zile de la data comunicării.</p>
          <p>4.2. Părțile convin că rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de ${propertyDetails.terminationNotice} de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu remediază problema ce determină rezilierea contractului.</p>
          <p>4.3. Părțile sunt de acord că dacă încetarea contractului intervine în perioada inițială de ${propertyDetails.contractDuration} luni, din orice motiv, partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, cu titlu de daune-interese, o sumă egală cu ${propertyDetails.earlyTerminationFee}.</p>
          <p>4.4. Prin excepție, în situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de ${propertyDetails.latePaymentTermination} de zile de la scadența neonorată.</p>
          <p>4.5. În ceea ce privește obligațiile de plată stabilite prin prezentul contract, părțile convin că se află de drept în întârziere.</p>
          
          <h2>5. OBLIGAȚIILE PROPRIETARULUI</h2>
          <p>5.1. Proprietarul se obligă să pună la dispoziția Chiriașului apartamentul în scopul utilizării acestuia ca locuință.</p>
          <p>5.2. Proprietarul este răspunzător și își asumă efectuarea oricăror reparații majore, care țin de structura de rezistență a apartamentului sau cele care devin necesare în vederea utilizării apartamentului în conformitate cu destinația sa.</p>
          <p>5.3. Proprietarul va informa Chiriașul și va transmite acestuia orice facturi emise de furnizorii de utilități, cu excepția celor care sunt comunicate la adresa poștală a apartamentului.</p>
          <p>5.4. Proprietarul va achita toate cheltuielile aferente întreținerii și utilităților pentru perioada anterioară predării apartamentului.</p>
          
          <h2>6. OBLIGAȚIILE CHIRIAȘULUI</h2>
          <p>6.1. Chiriașul este obligat să folosească apartamentul cu prudență și diligență, să se îngrijească de acesta și să se asigure că utilizează echipamentele și electrocasnicele care se regăsesc în apartament în conformitate cu manualul și instrucțiunile de utilizare puse la dispoziție de Proprietar.</p>
          <p>6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta. Pentru claritate, reparații ce țin de întreținerea curentă sunt, cu titlu exemplificativ: reparații necesare ca urmare a uzurii normale a lucrurilor (reparații minore de tâmplărie, reparația sau înlocuirea unor elemente precum prize, întrerupătoare, robineți, etc.).</p>
          <p>6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii sau în cadrul unui service autorizat, după caz, pe bază de contract de prestări servicii și garanție pentru lucrările astfel efectuate.</p>
          <p>6.4. Chiriașul va notifica cu privire la orice defecțiuni sau reparații care sunt necesare și care cad în sarcina Proprietarului în cel mai scurt timp posibil, prin e-mail, astfel încât acestea să poată fi realizate în timp util. În ipoteza neîndeplinirii obligației de informare, reparațiile vor cădea în sarcina Chiriașului.</p>
          <p>6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.</p>
          <p>6.6. Chiriașul își asumă plata tuturor facturilor de utilități, precum și efectuarea tuturor cheltuielilor ce țin de utilizarea apartamentului. În ipoteza neîndeplinirii la timp a obligațiilor de plată, Chiriașul este răspunzător și își asumă integral plata penalităților de întârziere și a eventualelor cheltuieli de recuperare a debitelor restante efectuate de furnizori, inclusiv cheltuieli de judecată, după caz.</p>
          <p>6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la solicitarea acestuia din urmă, la o dată și oră stabilite de comun acord, în avans. Părțile convin că lipsa repetată a disponibilității Chiriașului pentru îndeplinirea acestei obligații poate constitui motiv pentru rezilierea contractului.</p>
          <p>6.8. Chiriașul nu are dreptul de schimba destinația apartamentului sau de a ceda folosința apartamentului, total sau parțial, cu titlu oneros sau gratuit, fără acordul prealabil scris al proprietarului.</p>
          <p>6.9. Chiriașul are obligația ca odată cu încetarea contratului, să înceteze orice contracte de prestări servicii încheiate în numele său care presupun prestarea serviciilor la adresa apartamentului închiriat.</p>
          <p>6.10. Chiriasul nu are voie sa introduca in locatie animale, animale de companie sau orice fel de vietuitoare fara acordul prealabil in scris al proprietarului.</p>
          <p>6.11. Chiriasul trebuie sa mentioneze la momentul semnarii contractului numarul exact de persoane care vor locui in imobil pe perioada inchirierii, acest lucru fiind necesar proprietarului pentru a-l declara la administratie.</p>
          <p>6.12. Chiriasul este de acord sa semneze AXENA 1 care cuprinde un inventar al lucrurilor/electrocasnicelor/bunurilor ce sunt in imobil. De acemenea la intrarea in imobil se vor face poze la aceste bunuri si la starea imobilului, poze ce vor fi comunicate prin email dupa semnare. Acest email va reprezenta o dovada a starii imobilului si bunurilor aflate in custodia chiriasului de la data semnarii prezentului contract. Orice paguba adusa acestor bunuri sau imobilului in sine din culpa chiriasului, atrage raspunderea chiriasului. Pentru claritate, chiriasul va plati orice defectiune sau avarie din culpa lui, adusa bunurilor sau/si imobilului.</p>
          <p>6.14. Chiriasul este obligat la finalul contractului sa predea cheile, telecomanda parcare (daca este cazul) si orice bun pe care proprietarul l-a lasat in custodia chiriasului pe perioada derularii contractului.</p>
          
          <h2>7. GARANȚIA</h2>
          <p>7.1. Chiriașul este de acord să ofere, cu titlu de garanție, ${propertyDetails.securityDeposit}. Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește în mod corespunzător obligațiile asumate contractual. Garanția nu poate fi utilizată în contul ultimei chirii lunare, anterior încetării contractului din orice motiv. Garantia nu reprezinta o suma de bani perceputa de proprietar ca plata anticipata pentru eventuale daune ci reprezinta o plata anticipata cu acordul chiriasului pentru plati legate de intretinere, curent, apa, curatenie si igienizare, schimbarea yalei de la intrare, plati pe care proprietarul le primeste ulterior plecarii efective a chiriasului din imobil.</p>
          <p>7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, după expirarea unui termen suficient care să permită Proprietarului să verifice acuratețea consumurilor declarate de energie electrică, gaze naturale, apă rece/caldă, etc. fără ca această perioadă să depășească ${propertyDetails.depositReturnPeriod} luni de la data încetării contractului.</p>
          <p>7.3. Proprietarul are dreptul să rețină din suma constituită cu titlu de garanție orice sume reprezentând prejudicii cauzate de Chiriaș, contravaloare a reparațiilor necesare ca urmare a neefectuării lor de către Chiriaș precum si sume ce tin de curatenie si igienizare efectuate dupa eliberarea imobilului de catre chirias.</p>
          <p>7.4. Proprietarul nu are dreptul să pretindă Chiriașului despăgubiri pentru uzura normală a lucrurilor. Se consideră „uzură normală" modificările minore apărute în urma utilizării imobilului în conformitate cu destinația sa, cum ar fi:</p>
          <ul>
              <li>Degradarea pereților cauzată de trecerea timpului (decolorare, crăpături fine);</li>
              <li>Uzura mobilierului și echipamentelor electronice datorată utilizării corespunzătoare;</li>
              <li>Degradări mici la tâmplărie, prize, întrerupătoare, care nu sunt cauzate de neglijență sau folosire abuzivă.</li>
          </ul>
          <p>7.5. Garanția va fi utilizată exclusiv pentru acoperirea prejudiciilor cauzate de Chiriaș sau pentru cheltuieli restante asociate contractului. Proprietarul este obligat să comunice Chiriașului, în scris, cu detalii și justificări, orice utilizare a sumei constituite drept garanție.</p>
          <p>7.6. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți, care să includă starea bunurilor, a apartamentului și a utilităților la începutul și la finalul contractului.</p>
          <p>7.7. Orice litigiu legat de starea bunurilor și evaluarea prejudiciilor va fi soluționat printr-un expert autorizat desemnat de comun acord de către părți.</p>
          
          <h2>8. CLAUZE FINALE</h2>
          <p>8.1. Orice comunicare se va realiza în scris, prin e-mail, servicii de mesagerie instant/SMS, la adresele și numerele de telefon menționate în preambul prezentului contract. Modificările aduse prezentului contract vor fi realizate printr-un act adițional.</p>
          <p>8.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor judecătorești competente de pe raza Municipiului București.</p>
          
          <p>Prezentul contract a fost încheiat astăzi, ${contractDate}, în trei exemplare originale, câte unul pentru fiecare parte și unul pentru autoritatea fiscală.</p>
          
          <h3>Detalii contorizare utilități:</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <th>Tip serviciu/utilitate</th>
                  <th>Nivel contor la data încheierii contractului</th>
              </tr>
              <tr>
                  <td>Apă rece</td>
                  <td>${utilities.waterCold}</td>
              </tr>
              <tr>
                  <td>Apă caldă</td>
                  <td>${utilities.waterHot}</td>
              </tr>
              <tr>
                  <td>Curent electric</td>
                  <td>${utilities.electricity}</td>
              </tr>
              <tr>
                  <td>Gaze naturale</td>
                  <td>${utilities.gas}</td>
              </tr>
          </table>
          
          <h3>Listă bunuri mobile/electrocasnice:</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <th>Denumire bun</th>
                  <th>Valoare (lei)</th>
                  <th>Stare</th>
              </tr>
              ${assetsList}
          </table>
          
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
              <div style="width: 45%;">
                  <p><strong>PROPRIETAR,</strong></p>
                  <p>Data: ${ownerSignatureDate}</p>
                  <p>Nume în clar și semnătura:</p>
                  <p>${ownerSignatureName || '___________________________'}</p>
              </div>
              
              <div style="width: 45%;">
                  <p><strong>CHIRIAȘ,</strong></p>
                  <p>Data: ${tenantSignatureDate}</p>
                  <p>Nume în clar și semnătura:</p>
                  <p>${tenantSignatureName || '___________________________'}</p>
              </div>
          </div>
        </body>
      </html>
    `;

    // Create PDF
    const pdf = new jsPDF();
    
    // Add content to PDF
    pdf.html(contractContent, {
      callback: function (doc) {
        // Save the PDF
        doc.save(`contract_${contractNumber.replace('/', '_')}.pdf`);
      },
      x: 10,
      y: 10
    });
  };

  const handleGenerateContract = async () => {
    console.log("Attempting to generate contract with values:", {
      contractNumber,
      selectedTemplate,
      selectedProperty,
      contractType,
      validFrom,
      ownerDetails,
      tenantDetails,
      propertyDetails
    });

    if (!validateForm()) {
      console.log("Validation failed. Errors:", errors);
      toast({
        title: "Error",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!selectedTemplate || !selectedProperty || !contractType || !validFrom) {
        toast({
          title: "Error",
          description: "Te rugăm să selectezi un șablon și o proprietate",
          variant: "destructive",
        });
        return;
      }

      const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);
      
      if (!selectedTemplateData) {
        throw new Error("Template not found");
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not found");

      const contractContent = {
        contractNumber,
        ownerDetails,
        tenantDetails,
        propertyDetails,
        utilities,
        assets,
        validFrom,
        validUntil,
        baseTemplate: selectedTemplateData.content
      };

      const { data, error } = await supabase
        .from("contracts")
        .insert({
          property_id: selectedProperty,
          landlord_id: user.id,
          contract_type: contractType,
          valid_from: validFrom,
          valid_until: validUntil || null,
          status: "draft",
          content: contractContent as Json,
          template_id: selectedTemplate,
          metadata: {} as Json
        })
        .select()
        .single();

      if (error) throw error;

      // After successful contract creation, generate PDF
      generateContractPDF();

      toast({
        title: "Success",
        description: "Contract generated successfully",
      });

      navigate(`/contracts/${data.id}`);
    } catch (error) {
      console.error("Error generating contract:", error);
      toast({
        title: "Error",
        description: "A apărut o eroare la generarea contractului",
        variant: "destructive",
      });
    }
  };

  const createNewTemplate = async () => {
    try {
      const templateContent = {
        title: "CONTRACT DE ÎNCHIRIERE A LOCUINȚEI",
        sections: [
          {
            type: "header",
            content: "CONTRACT DE ÎNCHIRIERE A LOCUINȚEI"
          },
          {
            type: "contractNumber",
            content: "Nr. ${contractNumber}"
          },
          {
            type: "parties",
            title: "Părțile,",
            owner: "${ownerName}, Nr. ordine Reg. com./an: ${ownerReg}, Cod fiscal (C.U.I.): ${ownerFiscal}, cu sediul in ${ownerAddress}, Judetul: ${ownerCounty}, Localitatea: ${ownerCity}, cont bancar ${ownerBank}, deschis la ${ownerBankName}, reprezentat: ${ownerRepresentative}, e-mail: ${ownerEmail}, telefon: ${ownerPhone} în calitate de Proprietar",
            tenant: "${tenantName}, Nr. ordine Reg. com./an: ${tenantReg}, Cod fiscal (C.U.I.): ${tenantFiscal} cu domiciliul în ${tenantAddress}, Judetul: ${tenantCounty}, Localitatea: ${tenantCity}, cont bancar ${tenantBank}, deschis la ${tenantBankName}, reprezentat: ${tenantRepresentative}, e-mail: ${tenantEmail}, telefon: ${tenantPhone}, în calitate de Chiriaș"
          },
          {
            type: "agreement",
            content: "Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:"
          },
          {
            type: "propertyDetails",
            content: "Detalii proprietate:"
          },
          {
            type: "utilities",
            content: "Utilități:"
          },
          {
            type: "signatures",
            content: "Semnături:"
          }
        ],
        utilities: {
          waterCold: "${waterColdMeter}",
          waterHot: "${waterHotMeter}",
          electricity: "${electricityMeter}",
          gas: "${gasMeter}"
        },
        signatures: {
          owner: {
            date: "${ownerSignatureDate}",
            name: "${ownerSignatureName}"
          },
          tenant: {
            date: "${tenantSignatureDate}",
            name: "${tenantSignatureName}"
          }
        }
      };

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          name: 'Contract de închiriere standard',
          category: 'lease',
          content: templateContent,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Template-ul a fost creat cu succes",
      });

      queryClient.invalidateQueries({ queryKey: ["contractTemplates"] });

    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "A apărut o eroare la crearea template-ului",
        variant: "destructive",
      });
    }
  };

  const inputClassName = (errorKey: string) =>
    `${errors[errorKey] ? "border-red-500 focus-visible:ring-red-500" : ""}`;

  if (isLoadingTemplates || isLoadingProperties) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contracts
          </Button>
          <Button onClick={createNewTemplate}>
            Creează Template Nou
          </Button>
        </div>

        <div className="space-y-6">
          {/* Your form content here */}
        </div>

        <Button 
          className="w-full" 
          onClick={handleGenerateContract}
          disabled={Object.keys(errors).length > 0}
        >
          Generează Contract
        </Button>
      </div>
    </PageLayout>
  );
}
