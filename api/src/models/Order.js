// Encomenda: as LINHAS são embebidas (lidas sempre com a encomenda e copiadas no momento da compra);
// comprador e produtor são REFERENCIADOS (existem por si e têm muitas encomendas).
const { Schema, model, Types } = require('mongoose');

const ESTADOS = ['pendente', 'confirmada', 'pronta', 'entregue'];

const orderSchema = new Schema({
  comprador: { type: Types.ObjectId, ref: 'User', required: true },
  produtor: { type: Types.ObjectId, ref: 'User', required: true },
  linhas: [{
    produto: { type: Types.ObjectId, ref: 'Product' },
    nome: String,      // cópia do nome no momento da compra
    precoUnit: Number, // cópia do preço no momento da compra (se o preço mudar, a encomenda não muda)
    quantidade: { type: Number, min: 1 }
  }],
  total: { type: Number, min: 0 },
  estado: { type: String, enum: ESTADOS, default: 'pendente' },
  // Histórico das mudanças de estado (quem acompanha a encomenda vê quando mudou)
  historico: [{
    estado: { type: String, enum: ESTADOS },
    em: { type: Date, default: Date.now }
  }],
  entrega: {
    tipo: { type: String, enum: ['levantamento', 'entrega'], default: 'levantamento' },
    morada: String
  }
}, { timestamps: true });

// Passo 4: índices para "as minhas encomendas" (comprador) e "encomendas recebidas" (produtor)
orderSchema.index({ comprador: 1, createdAt: -1 });
orderSchema.index({ produtor: 1, createdAt: -1 });

orderSchema.statics.ESTADOS = ESTADOS;

module.exports = model('Order', orderSchema);