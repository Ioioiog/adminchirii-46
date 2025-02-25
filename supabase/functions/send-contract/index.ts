
import { serve } from "std/server";
import { createClient } from '@supabase/supabase-js';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const generateContractHtml = (contract: any) => {
  const metadata = contract.metadata || {};
  const assets = metadata.assets || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract ${metadata.contractNumber || ''}</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: black;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
          }
          table { 
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
          }
          .section {
            margin-bottom: 24px;
          }
          h1 { 
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 32px;
          }
          h2 { 
            font-size: 18px;
            font-weight: bold;
            margin-top: 24px;
            margin-bottom: 16px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 64px;
          }
          .signature-block {
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-image {
            max-width: 200px;
            margin-top: 8px;
          }
          .list-section {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <h1>CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
        
        <p>Nr. ${metadata.contractNumber || '_____'}</p>
        <p>Data: ${metadata.contractDate || '_____'}</p>

        <p>Părțile,</p>

        <div class="section">
          ${metadata.ownerName}, Nr. ordine Reg. com./an: ${metadata.ownerReg}, Cod fiscal (C.U.I.): ${metadata.ownerFiscal},
          cu sediul in ${metadata.ownerAddress}, cont bancar ${metadata.ownerBank}, deschis la ${metadata.ownerBankName},
          reprezentat: ${metadata.ownerRepresentative}, e-mail: ${metadata.ownerEmail}, telefon: ${metadata.ownerPhone} în calitate de Proprietar,
        </div>

        <div class="section">
          ${metadata.tenantName}, Nr. ordine Reg. com./an: ${metadata.tenantReg}, Cod fiscal (C.U.I.): ${metadata.tenantFiscal},
          cu domiciliul în ${metadata.tenantAddress}, cont bancar ${metadata.tenantBank}, deschis la ${metadata.tenantBankName},
          reprezentat: ${metadata.tenantRepresentative}, e-mail: ${metadata.tenantEmail}, telefon: ${metadata.tenantPhone} în calitate de Chiriaș,
        </div>

        <p>Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

        <h2>1. OBIECTUL CONTRACTULUI</h2>
        <p>
          1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${metadata.propertyAddress}, 
          compus din ${metadata.roomCount} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
          incepand cu data de ${metadata.startDate} ca locuință pentru familia sa.
        </p>

        <h2>2. PREȚUL CONTRACTULUI</h2>
        <div class="section">
          <p>
            2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${metadata.rentAmount} EUR 
            ${metadata.vatIncluded === "nu" ? "+ TVA" : "(TVA inclus)"}. Plata chiriei se realizează în ziua de ${metadata.paymentDay} 
            a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului.
            Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.
          </p>
          <p>
            2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează 
            zilei de ${metadata.paymentDay}.
          </p>
          <p>
            2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de ${metadata.lateFee}% pentru fiecare 
            zi de întârziere.
          </p>
          <p>
            2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.
          </p>
          <p>
            2.5. Părțile convin că, la expirarea perioadei inițiale de ${metadata.contractDuration} luni, Proprietarul are dreptul de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua valoare propusă a chiriei.
          </p>
          <p>
            2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT (Statistical Office of the European Communities), calculat pentru anul precedent. Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data de aplicare, aceasta devenind efectivă de la 1 ianuarie al fiecărui an.
          </p>
          <p>
            2.7. Dacă Chiriașul acceptă ajustarea, contractul se prelungește automat în noile condiții. Dacă Chiriașul nu este de acord, contractul încetează de drept la expirarea perioadei inițiale de 12 luni, fără penalități pentru niciuna dintre părți.
          </p>
        </div>

        <h2>3. DURATA CONTRACTULUI</h2>
        <div class="section">
          <p>
            3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de ${metadata.contractDuration} luni. Părțile convin că perioada inițială minimă este de esența contractului.
          </p>
          <p>
            3.2. La expirarea perioadei inițiale minime, operează tacita relocațiune, cu perioade succesive de câte 12 luni.
          </p>
        </div>

        <h2>4. ÎNCETAREA CONTRACTULUI</h2>
        <div class="section">
          <p>
            4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 90 de zile de la data comunicării.
          </p>
          <p>
            4.2. Părțile convin că rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 30 de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu remediază problema ce determină rezilierea contractului.
          </p>
          <p>
            4.3. Părțile sunt de acord că dacă încetarea contractului intervine în perioada inițială de 12 luni, din orice motiv, partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, cu titlu de daune-interese, o sumă egală cu contravaloarea unei chirii lunare.
          </p>
          <p>
            4.4. Prin excepție, în situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de 40 de zile de la scadența neonorată.
          </p>
          <p>
            4.5. În ceea ce privește obligațiile de plată stabilite prin prezentul contract, părțile convin că se află de drept în întârziere.
          </p>
        </div>

        <h2>5. OBLIGAȚIILE PROPRIETARULUI</h2>
        <div class="section">
          <p>5.1. Să asigure folosința nestingherită a spațiului închiriat.</p>
          <p>5.2. Să execute reparațiile majore și structurale.</p>
          <p>5.3. Să transmită facturile de utilități.</p>
          <p>5.4. Să achite cheltuielile anterioare predării.</p>
        </div>

        <h2>6. OBLIGAȚIILE CHIRIAȘULUI</h2>
        <div class="section">
          <p>6.1. Să folosească spațiul cu prudență și diligență.</p>
          <p>6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta. Pentru claritate, reparații ce țin de întreținerea curentă sunt, cu titlu exemplificativ: reparații necesare ca urmare a uzurii normale a lucrurilor (reparații minore de tâmplărie, reparația sau înlocuirea unor elemente precum prize, întrerupătoare, robineți, etc.).</p>
          <p>6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii sau în cadrul unui service autorizat, după caz, pe bază de contract de prestări servicii și garanție pentru lucrările astfel efectuate.</p>
          <p>6.4. Chiriașul va notifica cu privire la orice defecțiuni sau reparații care sunt necesare și care cad în sarcina Proprietarului în cel mai scurt timp posibil, prin e-mail, astfel încât acestea să poată fi realizate în timp util. În ipoteza neîndeplinirii obligației de informare, reparațiile vor cădea în sarcina Chiriașului.</p>
          <p>6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.</p>
          <p>6.6. Chiriașul își asumă plata tuturor facturilor de utilități, precum și efectuarea tuturor cheltuielilor ce țin de utilizarea apartamentului. În ipoteza neîndeplinirii la timp a obligațiilor de plată, Chiriașul este răspunzător și își asumă integral plata penalităților de întârziere și a eventualelor cheltuieli de recuperare a debitelor restante efectuate de furnizori, inclusiv cheltuieli de judecată, după caz.</p>
          <p>6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la solicitarea acestuia din urmă, la o dată și oră stabilite de comun acord, în avans.</p>
          <p>6.8. Chiriașul nu are dreptul de schimba destinația apartamentului sau de a ceda folosința apartamentului, total sau parțial, cu titlu oneros sau gratuit, fără acordul prealabil scris al proprietarului.</p>
          <p>6.9. Chiriașul are obligația ca odată cu încetarea contratului, să înceteze orice contracte de prestări servicii încheiate în numele său care presupun prestarea serviciilor la adresa apartamentului închiriat.</p>
          <p>6.10. Chiriasul nu are voie sa introduca in locatie animale, animale de companie sau orice fel de vietuitoare fara acordul prealabil in scris al proprietarului.</p>
          <p>6.11. Chiriasul trebuie sa mentioneze la momentul semnarii contractului numarul exact de persoane care vor locui in imobil pe perioada inchirierii, acest lucru fiind necesar proprietarului pentru a-l declara la administratie.</p>
          <p>6.12. Chiriasul este de acord sa semneze ANEXA 1 care cuprinde un inventar al lucrurilor/electrocasnicelor/bunurilor ce sunt in imobil. De asemenea la intrarea in imobil se vor face poze la aceste bunuri si la starea imobilului, poze ce vor fi comunicate prin email dupa semnare.</p>
          <p>6.13. Chiriasul este obligat la finalul contractului sa predea cheile, telecomanda parcare (daca este cazul) si orice bun pe care proprietarul l-a lasat in custodia chiriasului pe perioada derularii contractului.</p>
        </div>

        <h2>7. GARANȚIA</h2>
        <div class="section">
          <p>7.1. Chiriașul este de acord să ofere, cu titlu de garanție, contravaloarea unei chirii lunare. Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește în mod corespunzător obligațiile asumate contractual. Garanția nu poate fi utilizată în contul ultimei chirii lunare, anterior încetării contractului din orice motiv.</p>
          <p>7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, după expirarea unui termen suficient care să permită Proprietarului să verifice acuratețea consumurilor declarate de energie electrică, gaze naturale, apă rece/caldă, etc. fără ca această perioadă să depășească trei luni de la data încetării contractului.</p>
          <p>7.3. Proprietarul are dreptul să rețină din suma constituită cu titlu de garanție orice sume reprezentând prejudicii cauzate de Chiriaș, contravaloare a reparațiilor necesare ca urmare a neefectuării lor de către Chiriaș precum si sume ce tin de curatenie si igienizare efectuate dupa eliberarea imobilului de catre chirias.</p>
          <p>7.4. Proprietarul nu are dreptul să pretindă Chiriașului despăgubiri pentru uzura normală a lucrurilor. Se consideră „uzură normală" modificările minore apărute în urma utilizării imobilului în conformitate cu destinația sa, cum ar fi:</p>
          <ul class="list-section">
            <li>Degradarea pereților cauzată de trecerea timpului (decolorare, crăpături fine);</li>
            <li>Uzura mobilierului și echipamentelor electronice datorată utilizării corespunzătoare;</li>
            <li>Degradări mici la tâmplărie, prize, întrerupătoare, care nu sunt cauzate de neglijență sau folosire abuzivă.</li>
          </ul>
          <p>7.5. Garanția va fi utilizată exclusiv pentru acoperirea prejudiciilor cauzate de Chiriaș sau pentru cheltuieli restante asociate contractului. Proprietarul este obligat să comunice Chiriașului, în scris, cu detalii și justificări, orice utilizare a sumei constituite drept garanție.</p>
          <p>7.6. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți, care să includă starea bunurilor, a apartamentului și a utilităților la începutul și la finalul contractului.</p>
          <p>7.7. Orice litigiu legat de starea bunurilor și evaluarea prejudiciilor va fi soluționat printr-un expert autorizat desemnat de comun acord de către părți.</p>
        </div>

        <h2>8. CLAUZE FINALE</h2>
        <div class="section">
          <p>
            8.1. Orice comunicare se va realiza în scris, prin e-mail, servicii de mesagerie instant/SMS, la adresele și numerele de telefon menționate în preambul prezentului contract. Modificările aduse prezentului contract vor fi realizate printr-un act adițional.
          </p>
          <p>
            8.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor judecătorești competente de pe raza Municipiului București.
          </p>
          <p>
            Prezentul contract a fost încheiat astăzi, ${metadata.contractDate}, în trei exemplare originale, câte unul pentru fiecare parte și unul pentru autoritatea fiscală.
          </p>
        </div>

        <h2>ANEXA 1 - LISTA BUNURI MOBILE/ELECTROCASNICE</h2>
        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Denumire bun</th>
                <th>Valoare (lei)</th>
                <th>Stare</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map((asset: any) => `
                <tr>
                  <td>${asset.name}</td>
                  <td>${asset.value}</td>
                  <td>${asset.condition}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h2>ANEXA 2 - DETALII CONTORIZARE UTILITĂȚI</h2>
        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Tip serviciu/utilitate</th>
                <th>Nivel contor la data încheierii contractului</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Apă rece</td>
                <td>${metadata.waterColdMeter}</td>
              </tr>
              <tr>
                <td>Apă caldă</td>
                <td>${metadata.waterHotMeter}</td>
              </tr>
              <tr>
                <td>Curent electric</td>
                <td>${metadata.electricityMeter}</td>
              </tr>
              <tr>
                <td>Gaze naturale</td>
                <td>${metadata.gasMeter}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="signatures">
          <div class="signature-block">
            <p><strong>PROPRIETAR</strong></p>
            <p>Data: ${metadata.ownerSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.ownerSignatureName || '_____'}</p>
            ${metadata.ownerSignatureImage ? `
              <img 
                src="${metadata.ownerSignatureImage}" 
                alt="Owner Signature" 
                class="signature-image"
              />
            ` : ''}
          </div>
          
          <div class="signature-block">
            <p><strong>CHIRIAȘ</strong></p>
            <p>Data: ${metadata.tenantSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.tenantSignatureName || '_____'}</p>
            ${metadata.tenantSignatureImage ? `
              <img 
                src="${metadata.tenantSignatureImage}" 
                alt="Tenant Signature" 
                class="signature-image"
              />
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Starting contract send process...');
    const { contractId, recipientEmail } = await req.json();
    
    if (!contractId || !recipientEmail) {
      throw new Error('Contract ID and recipient email are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Database configuration is missing');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching contract data...');
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        properties(name)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Error fetching contract:', contractError);
      throw new Error('Failed to fetch contract details');
    }

    console.log('Contract data fetched successfully:', {
      id: contract.id,
      propertyName: contract.properties?.name,
      hasMetadata: !!contract.metadata
    });

    const contractHtml = generateContractHtml(contract);

    // Send email
    console.log('Preparing to send email...');
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error('Email service configuration is missing');
    }

    const resend = new Resend(resendApiKey);
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://www.adminchirii.ro';
    
    console.log('Sending email...');
    const emailResponse = await resend.emails.send({
      from: 'Contract System <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `Contract de închiriere - ${contract.properties?.name || 'Proprietate'}`,
      html: contractHtml,
    });

    console.log('Email sent successfully:', {
      emailId: emailResponse.id,
      recipient: recipientEmail
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in send-contract function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
