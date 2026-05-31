import { Save } from "lucide-react";
import { createClientAction } from "@/app/admin/actions";

export function ClientForm() {
  return (
    <section className="panel h-fit p-5">
      <h2 className="text-lg font-black text-ink">Novo cliente</h2>
      <form action={createClientAction} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="brandName">
            Marca private label
          </label>
          <input className="field" id="brandName" name="brandName" required placeholder="Nutri Alfa" />
        </div>

        <div>
          <label className="label" htmlFor="legalName">
            Razão social
          </label>
          <input className="field" id="legalName" name="legalName" required placeholder="Nutri Alfa Ltda." />
        </div>

        <div>
          <label className="label" htmlFor="taxId">
            CNPJ
          </label>
          <input className="field" id="taxId" name="taxId" placeholder="00.000.000/0001-00" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <label className="label" htmlFor="contactName">
              Contato
            </label>
            <input className="field" id="contactName" name="contactName" placeholder="Nome do responsável" />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Telefone
            </label>
            <input className="field" id="phone" name="phone" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input className="field" id="email" name="email" type="email" placeholder="contato@cliente.com.br" />
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-ink">
          <input className="h-4 w-4 accent-leaf" type="checkbox" name="active" defaultChecked />
          Cliente ativo
        </label>

        <button className="btn-primary w-full" type="submit">
          <Save size={18} aria-hidden="true" />
          Salvar cliente
        </button>
      </form>
    </section>
  );
}
